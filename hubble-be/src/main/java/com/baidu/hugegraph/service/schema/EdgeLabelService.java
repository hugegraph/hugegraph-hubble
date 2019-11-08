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
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.driver.SchemaManager;
import com.baidu.hugegraph.entity.schema.ConflictDetail;
import com.baidu.hugegraph.entity.schema.ConflictStatus;
import com.baidu.hugegraph.entity.schema.EdgeLabelEntity;
import com.baidu.hugegraph.entity.schema.LabelUpdateEntity;
import com.baidu.hugegraph.entity.schema.Property;
import com.baidu.hugegraph.entity.schema.PropertyIndex;
import com.baidu.hugegraph.entity.schema.SchemaConflict;
import com.baidu.hugegraph.entity.schema.SchemaType;
import com.baidu.hugegraph.exception.ExternalException;
import com.baidu.hugegraph.exception.ServerException;
import com.baidu.hugegraph.structure.constant.Frequency;
import com.baidu.hugegraph.structure.schema.EdgeLabel;
import com.baidu.hugegraph.structure.schema.IndexLabel;
import com.baidu.hugegraph.structure.schema.PropertyKey;
import com.baidu.hugegraph.structure.schema.VertexLabel;
import com.baidu.hugegraph.util.Ex;
import com.google.common.collect.ImmutableList;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
public class EdgeLabelService extends SchemaService {

    @Autowired
    private PropertyKeyService pkService;
    @Autowired
    private VertexLabelService vlService;
    @Autowired
    private PropertyIndexService piService;

    public List<EdgeLabelEntity> list(int connId) {
        return this.list(Collections.emptyList(), connId);
    }

    public List<EdgeLabelEntity> list(List<String> names, int connId) {
        HugeClient client = this.client(connId);
        List<EdgeLabel> edgeLabels;
        if (CollectionUtils.isEmpty(names)) {
            edgeLabels = client.schema().getEdgeLabels();
        } else {
            edgeLabels = client.schema().getEdgeLabels(names);
        }
        List<IndexLabel> indexLabels = client.schema().getIndexLabels();

        List<EdgeLabelEntity> results = new ArrayList<>(edgeLabels.size());
        edgeLabels.forEach(edgeLabel -> {
            results.add(convert(edgeLabel, indexLabels));
        });
        return results;
    }

    public EdgeLabelEntity get(String name, int connId) {
        HugeClient client = this.client(connId);
        try {
            EdgeLabel edgeLabel = client.schema().getEdgeLabel(name);
            List<IndexLabel> indexLabels = client.schema().getIndexLabels();
            return convert(edgeLabel, indexLabels);
        } catch (ServerException e) {
            if (e.status() == Constant.STATUS_NOT_FOUND) {
                return null;
            }
            throw e;
        }
    }

    public void add(EdgeLabelEntity entity, int connId) {
        HugeClient client = this.client(connId);
        EdgeLabel edgeLabel = convert(entity, client);
        client.schema().addEdgeLabel(edgeLabel);

        List<IndexLabel> indexLabels = collectIndexLabels(entity, client);
        try {
            this.piService.atomicAddBatch(indexLabels, client);
        } catch (Exception e) {
            client.schema().removeEdgeLabel(edgeLabel.name());
            throw new ExternalException("schema.edgelabel.create.failed", e,
                                        entity.getName());
        }
    }

    public void update(LabelUpdateEntity entity, int connId) {
        entity.setType(SchemaType.EDGE_LABEL);
        HugeClient client = this.client(connId);
        EdgeLabel edgeLabel = convert(entity, client);

        // All existed indexlabels
        List<IndexLabel> existedIndexLabels = client.schema().getIndexLabels();
        List<String> existedIndexLabelNames = collectNames(existedIndexLabels);

        List<String> addedIndexLabelNames = entity.getAppendPropertyIndexNames();
        List<IndexLabel> addedIndexLabels = collectIndexLabels(
                                            addedIndexLabelNames, client);

        List<String> removedIndexLabelNames = entity.getRemovePropertyIndexes();
        List<IndexLabel> removedIndexLabels = collectIndexLabels(
                                              removedIndexLabelNames, client);

        for (String name : addedIndexLabelNames) {
            if (existedIndexLabelNames.contains(name)) {
                throw new ExternalException(
                          "schema.edgelabel.update.append-index-existed",
                          entity.getName(), name);
            }
        }
        for (String name : removedIndexLabelNames) {
            if (!existedIndexLabelNames.contains(name)) {
                throw new ExternalException(
                          "schema.edgelabel.update.remove-index-unexisted",
                          entity.getName(), name);
            }
        }

        // NOTE: property can append but doesn't support eliminate now
        client.schema().appendEdgeLabel(edgeLabel);

        try {
            this.piService.atomicAddBatch(addedIndexLabels, client);
        } catch (Exception e) {
            // client.schema().eliminateEdgeLabel(edgeLabel);
            throw new ExternalException("schema.edgelabel.update.failed", e,
                                        entity.getName());
        }

        try {
            this.piService.atomicRemoveBatch(removedIndexLabels, client);
        } catch (Exception e) {
            this.piService.removeBatch(addedIndexLabelNames, client);
            // client.schema().eliminateEdgeLabel(edgeLabel);
            throw new ExternalException("schema.edgelabel.update.failed", e,
                                        entity.getName());
        }
    }

    public void remove(String name, int connId) {
        HugeClient client = this.client(connId);
        client.schema().removeEdgeLabel(name);
    }

    public boolean exist(String name, int connId) {
        return this.get(name, connId) != null;
    }

    public ConflictDetail checkConflicts(List<String> names, int reusedConnId,
                                         int connId) {
        ConflictDetail detail = new ConflictDetail(SchemaType.EDGE_LABEL);
        if (names.isEmpty()) {
            return detail;
        }

        HugeClient reusedClient = this.client(reusedConnId);
        SchemaManager reusedSchema = reusedClient.schema();
        HugeClient targetClient = this.client(connId);

        List<EdgeLabel> reusedEdgeLabels = reusedSchema.getEdgeLabels(names);
        Map<String, EdgeLabel> originEdgeLabels = new HashMap<>();
        targetClient.schema().getEdgeLabels().forEach(el -> {
            originEdgeLabels.put(el.name(), el);
        });

        Set<String> pkNames = new HashSet<>();
        reusedEdgeLabels.forEach(vl -> pkNames.addAll(vl.properties()));
        detail.merge(this.pkService.checkConflict(new ArrayList<>(pkNames), reusedConnId, connId));

        // Collect all index labels to avoid multi get
        Map<String, List<IndexLabel>> relatedIndexLabels;
        relatedIndexLabels = collectReleatedIndexLabels(names, SchemaType.EDGE_LABEL, reusedClient);
        for (List<IndexLabel> reusedIndexLabels : relatedIndexLabels.values()) {
            detail.merge(this.piService.checkConflict(reusedIndexLabels, connId));
        }

        // Collect all linked vertex labels to avoid multi get
        Set<String> vlNames = new HashSet<>();
        reusedEdgeLabels.forEach(el -> {
            vlNames.add(el.sourceLabel());
            vlNames.add(el.targetLabel());
        });
        /*
         * Get vertex label conflict detail(contains property keys and
         * index labels conflict detail of linked vertex labels)
         */
        detail.merge(this.vlService.checkConflict(new ArrayList<>(vlNames), reusedConnId, connId));

        for (EdgeLabel reusedEdgeLabel : reusedEdgeLabels) {
            String name = reusedEdgeLabel.name();
            EdgeLabelEntity entity = convert(reusedEdgeLabel, relatedIndexLabels.get(name));

            // Firstly determine if any properties are conflicted
            if (detail.anyPropertyKeyConflict(reusedEdgeLabel.properties())) {
                detail.add(entity, ConflictStatus.DUPNAME);
                continue;
            }
            // Then determine if any property indexes are conflicted
            if (detail.anyPropertyIndexConflict(relatedIndexLabels.get(name))) {
                detail.add(entity, ConflictStatus.DUPNAME);
                continue;
            }
            // Then determine if source/target vertex labels are conflicted
            List<String> linkedVertexLabels;
            linkedVertexLabels = ImmutableList.of(reusedEdgeLabel.sourceLabel(),
                                                  reusedEdgeLabel.targetLabel());
            if (detail.anyVertexLabelConflict(linkedVertexLabels)) {
                detail.add(entity, ConflictStatus.DUPNAME);
                continue;
            }
            // Then check conflict of edge label itself
            EdgeLabel originEdgeLabel = originEdgeLabels.get(name);
            ConflictStatus status;
            if (originEdgeLabel == null) {
                status = ConflictStatus.PASSED;
            } else if (equals(reusedEdgeLabel, originEdgeLabel)) {
                status = ConflictStatus.EXISTED;
            } else {
                status = ConflictStatus.DUPNAME;
            }
            detail.add(entity, status);
        }
        return detail;
    }

    public ConflictStatus checkConflict(EdgeLabelEntity entity, int connId) {
        HugeClient client = this.client(connId);
        String name = entity.getName();
        EdgeLabel reusedEdgeLabel = convert(entity, client);
        EdgeLabel originEdgeLabel = convert(this.get(name, connId), client);
        if (originEdgeLabel == null) {
            return ConflictStatus.PASSED;
        } else if (equals(reusedEdgeLabel, originEdgeLabel)) {
            return ConflictStatus.EXISTED;
        } else {
            return ConflictStatus.DUPNAME;
        }
    }

    public void reuse(ConflictDetail detail, int connId) {
        Ex.check(!detail.hasConflict(), "schema.cannot-reuse-conflict");
        HugeClient client = this.client(connId);

        List<PropertyKey> propertyKeys = this.pkService.filter(detail, client);
        if (!propertyKeys.isEmpty()) {
            try {
                this.pkService.atomicAddBatch(propertyKeys, client);
            } catch (Exception e) {
                throw new ExternalException("schema.propertykey.reuse.failed", e);
            }
        }

        List<VertexLabel> vertexLabels = this.vlService.filter(detail, client);
        if (!vertexLabels.isEmpty()) {
            try {
                this.vlService.atomicAddBatch(vertexLabels, client);
            } catch (Exception e) {
                this.pkService.removeBatch(propertyKeys, client);
                throw new ExternalException("schema.vertexlabel.reuse.failed", e);
            }
        }

        List<EdgeLabel> edgeLabels = this.filter(detail, client);
        if (!edgeLabels.isEmpty()) {
            try {
                this.atomicAddBatch(edgeLabels, client);
            } catch (Exception e) {
                this.vlService.removeBatch(vertexLabels, client);
                this.pkService.removeBatch(propertyKeys, client);
                throw new ExternalException("schema.edgelabel.reuse.failed", e);
            }
        }

        List<IndexLabel> indexLabels = this.piService.filter(detail, client);
        if (!indexLabels.isEmpty()) {
            try {
                this.piService.atomicAddBatch(indexLabels, client);
            } catch (Exception e) {
                this.removeBatch(edgeLabels, client);
                this.vlService.removeBatch(vertexLabels, client);
                this.pkService.removeBatch(propertyKeys, client);
                throw new ExternalException("schema.propertyindex.reuse.failed",
                                            e);
            }
        }
    }

    public List<EdgeLabel> filter(ConflictDetail detail, HugeClient client) {
        return detail.getEdgeLabelConflicts().stream()
                     .filter(c -> c.getStatus() == ConflictStatus.PASSED)
                     .map(SchemaConflict::getEntity)
                     .map(e -> convert(e, client))
                     .collect(Collectors.toList());
    }

    public void atomicAddBatch(List<EdgeLabel> edgeLabels, HugeClient client)
                               throws Exception {
        atomicAddBatch(edgeLabels, client,
                       (c, el) -> c.schema().addEdgeLabel(el),
                       (c, n) -> c.schema().removeEdgeLabel(n),
                       SchemaType.EDGE_LABEL);
    }

    public void removeBatch(List<EdgeLabel> edgeLabels, HugeClient client) {
        removeBatch(collectNames(edgeLabels), client,
                    (c, n) -> c.schema().removeEdgeLabel(n),
                    SchemaType.EDGE_LABEL);
    }

    private static EdgeLabelEntity convert(EdgeLabel edgeLabel,
                                           List<IndexLabel> indexLabels) {
        if (edgeLabel == null) {
            return null;
        }
        Set<Property> properties = collectProperties(edgeLabel);
        List<PropertyIndex> propertyIndexes = collectPropertyIndexes(edgeLabel,
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
                              .style(getSchemaStyle(edgeLabel))
                              .createTime(getCreateTime(edgeLabel))
                              .build();
    }

    private static EdgeLabel convert(EdgeLabelEntity entity,
                                     HugeClient client) {
        if (entity == null) {
            return null;
        }
        Frequency frequency = entity.isLinkMultiTimes() ? Frequency.MULTIPLE :
                                                          Frequency.SINGLE;
        return client.schema().edgeLabel(entity.getName())
                     .sourceLabel(entity.getSourceLabel())
                     .targetLabel(entity.getTargetLabel())
                     .frequency(frequency)
                     .properties(toStringArray(entity.getPropNames()))
                     .sortKeys(toStringArray(entity.getSortKeys()))
                     .nullableKeys(toStringArray(entity.getNullableProps()))
                     .enableLabelIndex(entity.isOpenLabelIndex())
                     .userdata(USER_KEY_CREATE_TIME, entity.getCreateTime())
                     .userdata(USER_KEY_ICON, entity.getStyle().getIcon())
                     .userdata(USER_KEY_COLOR, entity.getStyle().getColor())
                     .build();
    }

    private static EdgeLabel convert(LabelUpdateEntity entity,
                                     HugeClient client) {
        if (entity == null) {
            return null;
        }
        Set<String> properties = new HashSet<>();
        if (entity.getAppendProperties() != null) {
            entity.getAppendProperties().forEach(p -> {
                properties.add(p.getName());
            });
        }
        return client.schema().edgeLabel(entity.getName())
                     .properties(toStringArray(properties))
                     .nullableKeys(toStringArray(properties))
                     .userdata(USER_KEY_ICON, entity.getStyle().getIcon())
                     .userdata(USER_KEY_COLOR, entity.getStyle().getColor())
                     .build();
    }

    private static boolean equals(EdgeLabel oldSchema, EdgeLabel newSchema) {
        return oldSchema.name().equals(newSchema.name()) &&
               oldSchema.sourceLabel().equals(newSchema.sourceLabel()) &&
               oldSchema.targetLabel().equals(newSchema.targetLabel()) &&
               oldSchema.frequency().equals(newSchema.frequency()) &&
               oldSchema.properties().equals(newSchema.properties()) &&
               oldSchema.sortKeys().equals(newSchema.sortKeys()) &&
               oldSchema.nullableKeys().equals(newSchema.nullableKeys()) &&
               oldSchema.enableLabelIndex() == newSchema.enableLabelIndex();
    }
}
