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

package com.baidu.hugegraph.service.graph;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.baidu.hugegraph.driver.GraphManager;
import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.entity.graph.EdgeEntity;
import com.baidu.hugegraph.entity.graph.VertexEntity;
import com.baidu.hugegraph.entity.query.GraphView;
import com.baidu.hugegraph.entity.schema.EdgeLabelEntity;
import com.baidu.hugegraph.entity.schema.PropertyKeyEntity;
import com.baidu.hugegraph.entity.schema.VertexLabelEntity;
import com.baidu.hugegraph.exception.ExternalException;
import com.baidu.hugegraph.service.HugeClientPoolService;
import com.baidu.hugegraph.service.schema.EdgeLabelService;
import com.baidu.hugegraph.service.schema.PropertyKeyService;
import com.baidu.hugegraph.service.schema.VertexLabelService;
import com.baidu.hugegraph.structure.GraphElement;
import com.baidu.hugegraph.structure.graph.Edge;
import com.baidu.hugegraph.structure.graph.Vertex;
import com.baidu.hugegraph.structure.schema.PropertyKey;
import com.baidu.hugegraph.util.DataTypeUtil;
import com.baidu.hugegraph.util.Ex;
import com.google.common.collect.ImmutableSet;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
public class GraphService {

    @Autowired
    private HugeClientPoolService poolService;
    @Autowired
    private PropertyKeyService pkService;
    @Autowired
    private VertexLabelService vlService;
    @Autowired
    private EdgeLabelService elService;

    public HugeClient client(int connId) {
        return this.poolService.getOrCreate(connId);
    }

    public GraphView addVertex(int connId, VertexEntity entity) {
        HugeClient client = this.client(connId);
        Vertex vertex = this.buildVertex(connId, entity);
        vertex = client.graph().addVertex(vertex);
        return GraphView.builder()
                        .vertices(ImmutableSet.of(vertex))
                        .edges(ImmutableSet.of())
                        .build();
    }

    public Vertex updateVertex(int connId, VertexEntity entity) {
        HugeClient client = this.client(connId);
        GraphManager graph = client.graph();
        Vertex vertex = this.buildVertex(connId, entity);
        // TODO: client should add updateVertex() method
        return graph.addVertex(vertex);
    }

    private Vertex buildVertex(int connId, VertexEntity entity) {
        Vertex vertex = new Vertex(entity.getLabel());
        VertexLabelEntity vl = this.vlService.get(entity.getLabel(), connId);
        // Allowed front-end always pass id
        if (vl.getIdStrategy().isCustomize()) {
            vertex.id(entity.getId());
        }
        this.fillProperties(connId, vertex, entity.getProperties());
        return vertex;
    }

    public GraphView addEdge(int connId, EdgeEntity entity) {
        HugeClient client = this.client(connId);
        GraphManager graph = client.graph();
        EdgeLabelEntity el = this.elService.get(entity.getLabel(), connId);
        Vertex sourceVertex = graph.getVertex(entity.getSourceId());
        Vertex targetVertex = graph.getVertex(entity.getTargetId());
        Ex.check(el.getSourceLabel().equals(sourceVertex.label()) &&
                 el.getTargetLabel().equals(targetVertex.label()),
                 "graph.edge.link-unmatched-vertex", el.getName(),
                 el.getSourceLabel(), el.getTargetLabel(),
                 sourceVertex.label(), targetVertex.label());

        Edge edge = this.buildEdge(connId, entity, sourceVertex, targetVertex);
        edge = graph.addEdge(edge);
        return GraphView.builder()
                        .vertices(ImmutableSet.of(sourceVertex, targetVertex))
                        .edges(ImmutableSet.of(edge))
                        .build();
    }

    public Edge updateEdge(int connId, EdgeEntity entity) {
        HugeClient client = this.client(connId);
        GraphManager graph = client.graph();
        Vertex sourceVertex = graph.getVertex(entity.getSourceId());
        Vertex targetVertex = graph.getVertex(entity.getTargetId());

        Edge edge = this.buildEdge(connId, entity, sourceVertex, targetVertex);
        // TODO: client should add updateEdge()
        return graph.addEdge(edge);
    }

    private Edge buildEdge(int connId, EdgeEntity entity,
                           Vertex source, Vertex target) {
        Edge edge = new Edge(entity.getLabel());
        edge.source(source);
        edge.target(target);
        this.fillProperties(connId, edge, entity.getProperties());
        return edge;
    }

    private void fillProperties(int connId, GraphElement element,
                                Map<String, Object> properties) {
        HugeClient client = this.client(connId);
        for (Map.Entry<String, Object> entry : properties.entrySet()) {
            String key = entry.getKey();
            Object rawValue = entry.getValue();
            PropertyKeyEntity pkEntity = this.pkService.get(key, connId);
            PropertyKey propertyKey = PropertyKeyService.convert(pkEntity,
                                                                 client);
            assert propertyKey != null;
            Object value;
            try {
                value = DataTypeUtil.convert(rawValue, propertyKey);
            } catch (IllegalArgumentException e) {
                throw new ExternalException("graph.property.convert.failed",
                                            e, key, rawValue);
            }
            element.property(key, value);
        }
    }
}
