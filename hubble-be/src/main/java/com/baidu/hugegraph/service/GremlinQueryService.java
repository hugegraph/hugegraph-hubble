/*
 * Copyright 2017 HugeGraph Authors
 *
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. The ASF
 * licenses this file to You under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

package com.baidu.hugegraph.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Service;

import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.entity.GremlinQuery;
import com.baidu.hugegraph.entity.GremlinResult;
import com.baidu.hugegraph.exception.ExternalException;
import com.baidu.hugegraph.exception.InternalException;
import com.baidu.hugegraph.structure.graph.Edge;
import com.baidu.hugegraph.structure.graph.Vertex;
import com.baidu.hugegraph.structure.gremlin.Result;
import com.baidu.hugegraph.structure.gremlin.ResultSet;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.Lists;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Scope(BeanDefinition.SCOPE_PROTOTYPE)
public class GremlinQueryService {

    private static final int BATCH_QUERY_VERTEX_IDS = 500;
    private static final int MAX_EDGES_PER_VERTEX = 200;
    private static final int SHOW_LIMIT_EDGE_TOTAL = 500;

    private static final Set<String> LIMITED_STEPS = ImmutableSet.of(
            "HugeGraphStep", "HugeVertexStep", "PathStep"
    );
    private static final Set<String> VERTEX_STEPS = ImmutableSet.of(
            "HugeGraphStep(vertex", "EdgeOtherVertexStep"
    );
    private static final Set<String> EDGE_STEPS = ImmutableSet.of(
            "HugeGraphStep(edge", "HugeVertexStep"
    );
    private static final Set<String> PATH_STEPS = ImmutableSet.of(
            "PathStep"
    );

    private static final String[] ESCAPE_SEARCH_LIST = new String[]{
            "\\", "\"", "'", "\n"
    };
    private static final String[] ESCAPE_TARGET_LIST = new String[]{
            "\\\\", "\\\"", "\\'", "\\n"
    };

    @Autowired
    private HugeClientPool pool;

    private HugeClient client;

    public GremlinResult executeQuery(GremlinQuery query) {
        this.client = this.pool.get(query.getConnectionId());
        if (client != null) {
            throw new ExternalException("Could not find connection by id %s",
                                        query.getConnectionId());
        }

        String rawGremlin = StringUtils.stripEnd(query.getContent(), ";");
        // NOTE: Get execute plan used for pre handle, maybe affect performance
        ExecutePlan plan = this.explain(rawGremlin);
        String gremlin = this.addLimitIfNeeded(plan, rawGremlin);
        log.info("gremlin ==> {}", gremlin);

        // Execute gremlin query
        ResultSet resultSet = this.client.gremlin().gremlin(gremlin).execute();
        GremlinResult.Type resultType = plan.resultType();
        List<Object> rawData = resultSet.data();
        List<Object> typedData = new ArrayList<>(rawData.size());
        resultSet.iterator().forEachRemaining(result -> {
            typedData.add(result.getObject());
        });
        // Build the graph view
        GremlinResult.GraphView graphView = this.buildGraphView(resultType,
                                                                typedData);
        return GremlinResult.builder()
                            .type(resultType)
                            .data(rawData)
                            .graphView(graphView)
                            .build();
    }

    private GremlinResult.GraphView buildGraphView(GremlinResult.Type resultType,
                                                   List<Object> typedData) {
        if (resultType == GremlinResult.Type.SINGLE ||
            typedData == null || typedData.isEmpty()) {
            return null;
        }
        GremlinResult.GraphView graphView = new GremlinResult.GraphView();
        List<Vertex> vertices = new ArrayList<>();
        List<Edge> edges = new ArrayList<>();
        switch (resultType) {
            case VERTEX:
                edges = this.edgesOfVertex(typedData);
                break;
            case EDGE:
                vertices = this.verticesOfEdge(typedData);
                break;
            case PATH:
                // getVertexFromPath();
                break;
            default:
                throw new AssertionError("Unknown gremlin result type");
        }
        graphView.setVertices(vertices);
        graphView.setEdges(edges);
        return graphView;
    }

    private List<Edge> edgesOfVertex(List<Object> objects) {
        List<Edge> edges = new ArrayList<>(objects.size() * 2);

        List<Object> vertexIds = this.dedupVertexIdFromVertices(objects, true);
        Lists.partition(vertexIds, BATCH_QUERY_VERTEX_IDS).forEach(group -> {
            String ids = StringUtils.join(group, ",");
            String gremlin = String.format("g.V(%s).bothE().dedup()" +
                                           ".limit(800000)", ids);
            ResultSet resultSet = client.gremlin().gremlin(gremlin).execute();
            // The edges count for per vertex
            Map<Object, Integer> degrees = new HashMap<>(resultSet.size());
            for (Iterator<Result> iterator = resultSet.iterator();
                 iterator.hasNext();) {
                Edge edge = iterator.next().getEdge();
                Object source = edge.sourceId();
                Object target = edge.targetId();
                // only add the interconnected edges of the found vertices
                if (!vertexIds.contains(source) ||
                    !vertexIds.contains(target)) {
                    continue;
                }

                int count = degrees.computeIfAbsent(source, k -> 0);
                degrees.put(source, count++);
                if (count >= MAX_EDGES_PER_VERTEX) {
                    break;
                }
                count = degrees.computeIfAbsent(target, k -> 0);
                degrees.put(target, count++);
                if (count >= MAX_EDGES_PER_VERTEX) {
                    break;
                }

                edges.add(edge);
                if (edges.size() >= SHOW_LIMIT_EDGE_TOTAL) {
                    break;
                }
            }
        });
        return edges;
    }

    private List<Vertex> verticesOfEdge(List<Object> objects) {
        List<Object> vertexIds = this.dedupVertexIdFromEdges(objects, false);
        return this.getVertices(vertexIds);
    }

    private List<Object> dedupVertexIdFromVertices(List<Object> objects,
                                                   boolean escape) {
        Set<Object> vertexIds = new HashSet<>();
        for (Object object : objects) {
            assert object instanceof Vertex : object;
            Vertex vertex = (Vertex) object;
            if (escape) {
                vertexIds.add(this.escapeId(vertex.id()));
            } else {
                vertexIds.add(vertex.id());
            }
        }
        return new ArrayList<>(vertexIds);
    }

    private List<Object> dedupVertexIdFromEdges(List<Object> objects,
                                                boolean escape) {
        Set<Object> vertexIds = new HashSet<>();
        for (Object object : objects) {
            assert object instanceof Edge : object;
            Edge edge = (Edge) object;
            if (escape) {
                vertexIds.add(this.escapeId(edge.sourceId()));
                vertexIds.add(this.escapeId(edge.targetId()));
            } else {
                vertexIds.add(edge.sourceId());
                vertexIds.add(edge.targetId());
            }
        }
        return new ArrayList<>(vertexIds);
    }

    private String escapeId(Object id) {
        if (!(id instanceof String)) {
            return id.toString();
        }
        String text = (String) id;
        text = StringUtils.replaceEach(text, ESCAPE_SEARCH_LIST,
                                       ESCAPE_TARGET_LIST);
        return StringUtils.wrap(text, '\'');
    }

    private List<Vertex> getVertices(List<Object> vertexIds) {
        List<Vertex> vertices = new ArrayList<>(vertexIds.size());
        Lists.partition(vertexIds, BATCH_QUERY_VERTEX_IDS).forEach(group -> {
            List<Vertex> results = client.traverser().vertices(group);
            vertices.addAll(results);
        });
        return vertices;
    }

    @SuppressWarnings("unchecked")
    private ExecutePlan explain(String gremlin) {
        // Get the execute plain
        String explain = gremlin + ".explain()";
        ResultSet resultSet = client.gremlin().gremlin(explain).execute();
        if (resultSet.data().size() != 1) {
            throw new InternalException("Generate execution plan failed");
        }
        Map<String, Object> steps = (Map<String, Object>) resultSet.data()
                                                                   .get(0);
        List<String> finalSteps = (List<String>) steps.get("final");
        if (finalSteps.size() == 0) {
            throw new InternalException("Execution plan format is incorrect");
        }
        return new ExecutePlan(finalSteps);
    }

    public String addLimitIfNeeded(ExecutePlan plan, String gremlin) {
        String lastStep = plan.lastFinalStep();
        boolean needLimited = LIMITED_STEPS.stream()
                                           .anyMatch(lastStep::startsWith);
        if (needLimited) {
            gremlin = gremlin + ".limit(255)";
        }
        return gremlin;
    }

    private static class ExecutePlan {

        private List<String> finalSteps;

        public ExecutePlan(List<String> finalSteps) {
            this.finalSteps = finalSteps;
        }

        public String lastFinalStep() {
            return this.finalSteps.get(this.finalSteps.size() - 1);
        }

        public GremlinResult.Type resultType() {
            String lastStep = this.lastFinalStep();
            if (VERTEX_STEPS.stream().anyMatch(lastStep::startsWith)) {
                return GremlinResult.Type.VERTEX;
            } else if (EDGE_STEPS.stream().anyMatch(lastStep::startsWith)) {
                return GremlinResult.Type.EDGE;
            } else if (PATH_STEPS.stream().anyMatch(lastStep::startsWith)) {
                return GremlinResult.Type.PATH;
            } else {
                // TODO: Further subdivision may be needed
                return GremlinResult.Type.SINGLE;
            }
        }
    }
}
