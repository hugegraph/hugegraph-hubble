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

package com.baidu.hugegraph.service.schema;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.driver.SchemaManager;
import com.baidu.hugegraph.entity.schema.AttachedProperty;
import com.baidu.hugegraph.entity.schema.EdgeLabelEntity;
import com.baidu.hugegraph.entity.schema.PropertyIndex;
import com.baidu.hugegraph.entity.schema.PropertyKeyEntity;
import com.baidu.hugegraph.entity.schema.SchemaLabelEntity;
import com.baidu.hugegraph.entity.schema.VertexLabelEntity;
import com.baidu.hugegraph.exception.ServerException;
import com.baidu.hugegraph.service.HugeClientPoolService;
import com.baidu.hugegraph.structure.constant.Frequency;
import com.baidu.hugegraph.structure.schema.EdgeLabel;
import com.baidu.hugegraph.structure.schema.IndexLabel;
import com.baidu.hugegraph.structure.schema.PropertyKey;
import com.baidu.hugegraph.structure.schema.SchemaLabel;
import com.baidu.hugegraph.structure.schema.VertexLabel;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SchemaService {

    @Autowired
    private HugeClientPoolService poolService;

    private HugeClient getClient(Integer connId) {
        return this.poolService.getOrCreate(connId);
    }

    public List<PropertyKeyEntity> listPropertyKeys(Integer connId) {
        HugeClient client = this.getClient(connId);
        List<PropertyKey> propertyKeys = client.schema().getPropertyKeys();
        List<PropertyKeyEntity> results = new ArrayList<>(propertyKeys.size());
        propertyKeys.forEach(propertyKey -> results.add(convert(propertyKey)));
        return results;
    }

    public PropertyKeyEntity getPropertyKey(String name, Integer connId) {
        HugeClient client = this.getClient(connId);
        try {
            PropertyKey propertyKey = client.schema().getPropertyKey(name);
            return convert(propertyKey);
        } catch (ServerException e) {
            if (e.exception() != null && e.status() == 404) {
                // return null if does not exist
                return null;
            }
            throw e;
        }
    }

    public void addPropertyKey(PropertyKeyEntity entity, Integer connId) {
        HugeClient client = this.getClient(connId);
        PropertyKey propertyKey = convert(entity, client);
        client.schema().addPropertyKey(propertyKey);
    }

    public void removePropertyKey(String name, Integer connId) {
        HugeClient client = this.getClient(connId);
        client.schema().removePropertyKey(name);
    }

    public boolean existPropertyKey(String name, int connId) {
        return this.getPropertyKey(name, connId) != null;
    }

    public MultiValueMap<String, String> usingPropertyKey(String name, int connId) {
        HugeClient client = this.getClient(connId);
        MultiValueMap<String, String> results = new LinkedMultiValueMap<>();
        List<VertexLabel> vertexLabels = client.schema().getVertexLabels();
        for (VertexLabel vertexLabel : vertexLabels) {
            if (vertexLabel.properties().contains(name)) {
                results.add("vertexlabels", vertexLabel.name());
            }
        }
        List<EdgeLabel> edgeLabels = client.schema().getEdgeLabels();
        for (EdgeLabel edgeLabel : edgeLabels) {
            if (edgeLabel.properties().contains(name)) {
                results.add("edgeLabels", edgeLabel.name());
            }
        }
        return results;
    }

    public List<VertexLabelEntity> listVertexLabels(Integer connId) {
        HugeClient client = this.getClient(connId);
        List<VertexLabel> vertexLabels = client.schema().getVertexLabels();
        List<IndexLabel> indexLabels = client.schema().getIndexLabels();
        List<VertexLabelEntity> results = new ArrayList<>(vertexLabels.size());
        vertexLabels.forEach(vertexLabel -> {
            results.add(convert(vertexLabel, indexLabels));
        });
        return results;
    }

    public VertexLabelEntity getVertexLabel(String name, Integer connId) {
        HugeClient client = this.getClient(connId);
        try {
            VertexLabel vertexLabel = client.schema().getVertexLabel(name);
            List<IndexLabel> indexLabels = client.schema().getIndexLabels();
            return convert(vertexLabel, indexLabels);
        } catch (ServerException e) {
            if (e.exception() != null && e.status() == 404) {
                return null;
            }
            throw e;
        }
    }

    public void addVertexLabel(VertexLabelEntity entity, Integer connId) {
        HugeClient client = this.getClient(connId);
        VertexLabel vertexLabel = convert(entity, client);
        List<IndexLabel> indexLabels = collectIndexLabels(entity, client);
        try {
            client.schema().addVertexLabel(vertexLabel);
            for (IndexLabel indexLabel : indexLabels) {
                client.schema().addIndexLabel(indexLabel);
            }
        } catch (Exception e) {
            log.error("Failed to add vertex label");
            // Rollback when exception occured
            client.schema().removeVertexLabel(vertexLabel.name());
        }
    }

    public void updateVertexLabel(VertexLabelEntity entity, Integer connId) {
        HugeClient client = this.getClient(connId);
        VertexLabel vertexLabel = convert(entity, client);
        client.schema().appendVertexLabel(vertexLabel);
    }

    public void removeVertexLabel(String name, Integer connId) {
        HugeClient client = this.getClient(connId);
        client.schema().removeVertexLabel(name);
    }

    public boolean existVertexLabel(String name, int connId) {
        return this.getVertexLabel(name, connId) != null;
    }

    public boolean usingVertexLabel(String name, int connId) {
        HugeClient client = this.getClient(connId);
        List<EdgeLabel> edgeLabels = client.schema().getEdgeLabels();
        for (EdgeLabel edgeLabel : edgeLabels) {
            if (edgeLabel.properties().contains(name)) {
                return true;
            }
        }
        return false;
    }

    public List<EdgeLabelEntity> listEdgeLabels(Integer connId) {
        HugeClient client = this.getClient(connId);
        List<EdgeLabel> edgeLabels = client.schema().getEdgeLabels();
        List<IndexLabel> indexLabels = client.schema().getIndexLabels();
        List<EdgeLabelEntity> results = new ArrayList<>(edgeLabels.size());
        edgeLabels.forEach(edgeLabel -> {
            results.add(convert(edgeLabel, indexLabels));
        });
        return results;
    }

    public EdgeLabelEntity getEdgeLabel(String name, Integer connId) {
        HugeClient client = this.getClient(connId);
        try {
            EdgeLabel edgeLabel = client.schema().getEdgeLabel(name);
            List<IndexLabel> indexLabels = client.schema().getIndexLabels();
            return convert(edgeLabel, indexLabels);
        } catch (ServerException e) {
            if (e.exception() != null && e.status() == 404) {
                return null;
            }
            throw e;
        }
    }

    public void addEdgeLabel(EdgeLabelEntity entity, Integer connId) {
        // create vertex label and index labels atomicly
        HugeClient client = this.getClient(connId);
        EdgeLabel edgeLabel = convert(entity, client);
        List<IndexLabel> indexLabels = collectIndexLabels(entity, client);
        try {
            client.schema().addEdgeLabel(edgeLabel);
            for (IndexLabel indexLabel : indexLabels) {
                client.schema().addIndexLabel(indexLabel);
            }
        } catch (Exception e) {
            log.error("Failed to add vertex label");
            // Rollback when exception occured
            client.schema().removeEdgeLabel(edgeLabel.name());
        }
    }

    public void removeEdgeLabel(String name, Integer connId) {
        HugeClient client = this.getClient(connId);
        client.schema().removeEdgeLabel(name);
    }

    public boolean existEdgeLabel(String name, int connId) {
        return this.getEdgeLabel(name, connId) != null;
    }

    private static PropertyKeyEntity convert(PropertyKey propertyKey) {
        return PropertyKeyEntity.builder()
                                .name(propertyKey.name())
                                .dataType(propertyKey.dataType())
                                .cardinality(propertyKey.cardinality())
                                .build();
    }

    private static PropertyKey convert(PropertyKeyEntity entity,
                                       HugeClient client) {
        return client.schema()
                     .propertyKey(entity.getName())
                     .dataType(entity.getDataType())
                     .cardinality(entity.getCardinality())
                     .build();
    }

    private static VertexLabelEntity convert(VertexLabel vertexLabel,
                                             List<IndexLabel> indexLabels) {
        Set<AttachedProperty> properties = collectAttachedProperty(vertexLabel);
        List<PropertyIndex> propertyIndexes = collectPropertyIndex(vertexLabel,
                                                                   indexLabels);
        return VertexLabelEntity.builder()
                                .name(vertexLabel.name())
                                .properties(properties)
                                .idStrategy(vertexLabel.idStrategy())
                                .primaryKeys(vertexLabel.primaryKeys())
                                .propertyIndexes(propertyIndexes)
                                .openLabelIndex(vertexLabel.enableLabelIndex())
                                .build();
    }

    private static VertexLabel convert(VertexLabelEntity entity,
                                       HugeClient client) {
        return client.schema().vertexLabel(entity.getName())
                     .idStrategy(entity.getIdStrategy())
                     .properties(entity.getPropNames().toArray(new String[]{}))
                     .primaryKeys(entity.getPrimaryKeys().toArray(new String[]{}))
                     .nullableKeys(entity.getNullableProps().toArray(new String[]{}))
                     .enableLabelIndex(entity.isOpenLabelIndex())
                     .userdata("icon", entity.getStyle().getIcon())
                     .userdata("color", entity.getStyle().getColor())
                     .build();
    }

    private static EdgeLabelEntity convert(EdgeLabel edgeLabel,
                                           List<IndexLabel> indexLabels) {
        Set<AttachedProperty> properties = collectAttachedProperty(edgeLabel);
        List<PropertyIndex> propertyIndexes = collectPropertyIndex(edgeLabel,
                                                                   indexLabels);
        boolean linkMultiTimes = edgeLabel.frequency() == Frequency.MULTIPLE;
        return EdgeLabelEntity.builder()
                              .name(edgeLabel.name())
                              .sourceLabel(edgeLabel.sourceLabel())
                              .targetLabel(edgeLabel.targetLabel())
                              .linkMultiTimes(linkMultiTimes)
                              .properties(properties)
                              .sortKeys(edgeLabel.sortKeys())
                              .propertyIndexes(propertyIndexes)
                              .openLabelIndex(edgeLabel.enableLabelIndex())
                              .build();
    }

    private static EdgeLabel convert(EdgeLabelEntity entity,
                                     HugeClient client) {
        Frequency frequency = entity.isLinkMultiTimes() ?
                              Frequency.MULTIPLE : Frequency.SINGLE;
        return client.schema().edgeLabel(entity.getName())
                     .sourceLabel(entity.getSourceLabel())
                     .targetLabel(entity.getTargetLabel())
                     .frequency(frequency)
                     .properties(entity.getPropNames().toArray(new String[]{}))
                     .sortKeys(entity.getSortKeys().toArray(new String[]{}))
                     .nullableKeys(entity.getNullableProps().toArray(new String[]{}))
                     .enableLabelIndex(entity.isOpenLabelIndex())
                     .build();
    }

    private static Set<AttachedProperty> collectAttachedProperty(
                                         SchemaLabel schemaLabel) {
        Set<AttachedProperty> properties = new HashSet<>();
        Set<String> nullableKeys = schemaLabel.nullableKeys();
        for (String property : schemaLabel.properties()) {
            boolean nullable = nullableKeys.contains(property);
            properties.add(new AttachedProperty(property, nullable));
        }
        return properties;
    }

    private static List<PropertyIndex> collectPropertyIndex(
                                       SchemaLabel schemaLabel,
                                       List<IndexLabel> indexLabels) {
        List<PropertyIndex> propertyIndexes = new ArrayList<>();
        for (IndexLabel indexLabel : indexLabels) {
            PropertyIndex propertyIndex;
            if (indexLabel.baseValue().equals(schemaLabel.name())) {
                propertyIndex = new PropertyIndex(indexLabel.name(),
                                                  indexLabel.indexType(),
                                                  indexLabel.indexFields());
                propertyIndexes.add(propertyIndex);
            }
        }
        return propertyIndexes;
    }

    private static List<IndexLabel> collectIndexLabels(SchemaLabelEntity entity,
                                                       HugeClient client) {
        SchemaManager schema = client.schema();
        List<PropertyIndex> propertyIndexes = entity.getPropertyIndexes();
        List<IndexLabel> indexLabels = new ArrayList<>(propertyIndexes.size());
        for (PropertyIndex index : propertyIndexes) {
            IndexLabel.Builder builder = schema.indexLabel(index.getName());
            if (entity.isVertexLabel()) {
                builder.onV(entity.getName());
            } else {
                builder.onE(entity.getName());
            }
            String[] fields = index.getFields().toArray(new String[]{});
            IndexLabel indexLabel = builder.indexType(index.getType())
                                           .by(fields)
                                           .build();
            indexLabels.add(indexLabel);
        }
        return indexLabels;
    }
}
