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
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.entity.AdjacentQuery;
import com.baidu.hugegraph.entity.ExecutePlan;
import com.baidu.hugegraph.entity.GremlinQuery;
import com.baidu.hugegraph.entity.GremlinResult;
import com.baidu.hugegraph.exception.ExternalException;
import com.baidu.hugegraph.exception.InternalException;
import com.baidu.hugegraph.structure.constant.Direction;
import com.baidu.hugegraph.structure.graph.Edge;
import com.baidu.hugegraph.structure.graph.Path;
import com.baidu.hugegraph.structure.graph.Vertex;
import com.baidu.hugegraph.structure.gremlin.Result;
import com.baidu.hugegraph.structure.gremlin.ResultSet;
import com.google.common.collect.Iterables;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class GremlinQueryService {

    private static final int BATCH_QUERY_IDS = 500;
    private static final int MAX_EDGES_PER_VERTEX = 100;
    private static final int SHOW_LIMIT_EDGE_TOTAL = 500;

    private static final String[] ESCAPE_SEARCH_LIST = new String[]{
            "\\", "\"", "'", "\n"
    };
    private static final String[] ESCAPE_TARGET_LIST = new String[]{
            "\\\\", "\\\"", "\\'", "\\n"
    };

    @Autowired
    private HugeClientPool pool;
    private HugeClient client;

    private void checkClientAvailable(Integer connectionId) {
        if (this.client != null) {
            return;
        }
        this.client = this.pool.get(connectionId);
        if (this.client == null) {
            throw new ExternalException("Could not get connection by id %s",
                                        connectionId);
        }
    }

    public GremlinResult executeQuery(GremlinQuery query, ExecutePlan plan) {
        this.checkClientAvailable(query.getConnectionId());
        String gremlin = query.getContent();
        log.debug("gremlin ==> {}", gremlin);
        // Execute gremlin query
        ResultSet resultSet = this.client.gremlin().gremlin(gremlin).execute();

        GremlinResult.Type resultType = plan.resultType();
        List<Object> typedData = new ArrayList<>(resultSet.data().size());
        resultSet.iterator().forEachRemaining(result -> {
            typedData.add(result.getObject());
        });
        // Build the graph view
        GremlinResult.GraphView graphView = this.buildGraphView(resultType,
                                                                typedData);
        return GremlinResult.builder()
                            .type(resultType)
                            .data(resultSet.data())
                            .graphView(graphView)
                            .build();
    }

    public GremlinResult expandVertex(AdjacentQuery query) {
        this.checkClientAvailable(query.getConnectionId());
        // Build gremlin query
        String gremlin = this.buildGremlinQuery(query);
        log.debug("gremlin ==> {}", gremlin);
        // Execute gremlin query
        ResultSet resultSet = this.client.gremlin().gremlin(gremlin).execute();

        List<Vertex> vertices = new ArrayList<>(resultSet.size());
        List<Edge> edges = new ArrayList<>(resultSet.size());
        for (Iterator<Result> iter = resultSet.iterator(); iter.hasNext();) {
            Path path = iter.next().getPath();
            List<Object> objects = path.objects();
            assert objects.size() == 3;
            edges.add((Edge) objects.get(1));
            vertices.add((Vertex) objects.get(2));
        }
        GremlinResult.GraphView graphView = new GremlinResult.GraphView(
                                                vertices, edges);
        return GremlinResult.builder()
                            .type(GremlinResult.Type.PATH)
                            .data(resultSet.data())
                            .graphView(graphView)
                            .build();
    }

    private String buildGremlinQuery(AdjacentQuery query) {
        StringBuilder sb = new StringBuilder("g.V(");
        // vertex id
        sb.append(this.escapeId(query.getVertexId())).append(")");
        // direction
        String direction = query.getDirection() != null ?
                           query.getDirection().name() :
                           Direction.BOTH.name();
        sb.append(".toE(").append(direction);
        // edge label
        if (query.getEdgeLabel() != null) {
            sb.append(", '").append(query.getEdgeLabel()).append("')");
        } else {
            sb.append(")");
        }
        // properties
        for (AdjacentQuery.Term term : query.getTerms()) {
            // key
            sb.append(".has('").append(term.getKey()).append("', ");
            // value
            sb.append(term.getOperator()).append("(")
              .append(this.escape(term.getValue())).append(")");
        }
        sb.append(")");
        // limit
        sb.append(".limit(").append(MAX_EDGES_PER_VERTEX).append(")");
        // other vertex
        sb.append(".otherV().path()");
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
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
                vertices = this.verticesOfPath(typedData);
                edges = this.edgesOfVertex((List<Object>) (Object) vertices);
                break;
            default:
                throw new AssertionError("Unknown gremlin result type");
        }
        graphView.setVertices(vertices);
        graphView.setEdges(edges);
        return graphView;
    }

    private List<Edge> edgesOfVertex(List<Object> objects) {
        Set<Object> vertexIds = new HashSet<>(objects.size());
        for (Object object : objects) {
            assert object instanceof Vertex : object;
            Vertex vertex = (Vertex) object;
            vertexIds.add(vertex.id());
        }

        List<Edge> edges = new ArrayList<>(objects.size() * 2);
        Iterables.partition(vertexIds, BATCH_QUERY_IDS).forEach(batch -> {
            List<String> escapedIds = batch.stream().map(this::escapeId)
                                           .collect(Collectors.toList());
            String ids = StringUtils.join(escapedIds, ",");
            // Exist better way?
            String gremlin = String.format("g.V(%s).bothE().dedup()" +
                                           ".limit(800000)", ids);
            ResultSet rs = this.client.gremlin().gremlin(gremlin).execute();
            // The edges count for per vertex
            Map<Object, Integer> degrees = new HashMap<>(rs.size());
            for (Iterator<Result> iter = rs.iterator(); iter.hasNext();) {
                Edge edge = iter.next().getEdge();
                Object source = edge.sourceId();
                Object target = edge.targetId();
                // only add the interconnected edges of the found vertices
                if (!vertexIds.contains(source) ||
                    !vertexIds.contains(target)) {
                    continue;
                }

                int count = degrees.computeIfAbsent(source, k -> 0);
                degrees.put(source, ++count);
                if (count >= MAX_EDGES_PER_VERTEX) {
                    break;
                }
                count = degrees.computeIfAbsent(target, k -> 0);
                degrees.put(target, ++count);
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
        Set<Object> vertexIds = new HashSet<>(objects.size());
        for (Object object : objects) {
            assert object instanceof Edge : object;
            Edge edge = (Edge) object;
            vertexIds.add(edge.sourceId());
            vertexIds.add(edge.targetId());
        }
        return this.getVertices(vertexIds);
    }

    private List<Vertex> verticesOfPath(List<Object> objects) {
        Set<Object> vertexIds = new HashSet<>(objects.size());
        // The path node can be an vertex, or an edge.
        for (Object object : objects) {
            assert object instanceof Path : object;
            Path path = (Path) object;
            for (Object elem : path.objects()) {
                if (elem instanceof Vertex) {
                    Vertex vertex = (Vertex) elem;
                    vertexIds.add(vertex.id());
                } else {
                    assert elem instanceof Edge : elem;
                    Edge edge = (Edge) elem;
                    vertexIds.add(edge.sourceId());
                    vertexIds.add(edge.targetId());
                }
            }
        }
        return this.getVertices(vertexIds);
    }

    private List<Vertex> getVertices(Set<Object> vertexIds) {
        List<Vertex> vertices = new ArrayList<>(vertexIds.size());
        Iterables.partition(vertexIds, BATCH_QUERY_IDS).forEach(batch -> {
            List<Vertex> results = this.client.traverser().vertices(batch);
            vertices.addAll(results);
        });
        return vertices;
    }

    @SuppressWarnings("unchecked")
    @Cacheable(value = "explain", key = "#query.content")
    public ExecutePlan explain(GremlinQuery query) {
        this.checkClientAvailable(query.getConnectionId());
        // Remove the trailing redundant semicolon
        String gremlin = StringUtils.stripEnd(query.getContent(), ";");
        // Get the execute plain
        String explain = gremlin + ".explain()";
        log.debug("explain ==> {}", explain);

        ResultSet resultSet = this.client.gremlin().gremlin(explain).execute();
        if (resultSet.data().size() != 1) {
            throw new InternalException("Generate execution plan failed");
        }
        Map<String, Object> steps = (Map<String, Object>) resultSet.data()
                                                                   .get(0);
        List<String> finalSteps = (List<String>) steps.get("final");
        if (finalSteps.size() == 0) {
            throw new InternalException("Execute plan format is incorrect");
        }
        return new ExecutePlan(finalSteps);
    }

    private String escapeId(Object id) {
        if (!(id instanceof String)) {
            return id.toString();
        }
        String text = (String) id;
        text = StringUtils.replaceEach(text, ESCAPE_SEARCH_LIST,
                                       ESCAPE_TARGET_LIST);
        return (String) this.escape(text);
    }

    private Object escape(Object object) {
        if (!(object instanceof String)) {
            return object;
        }
        return StringUtils.wrap((String) object, '\'');
    }
}
