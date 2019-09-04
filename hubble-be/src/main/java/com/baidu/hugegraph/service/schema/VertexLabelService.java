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

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.driver.SchemaManager;
import com.baidu.hugegraph.entity.schema.ConflictDetail;
import com.baidu.hugegraph.entity.schema.ConflictStatus;
import com.baidu.hugegraph.entity.schema.LabelUpdateEntity;
import com.baidu.hugegraph.entity.schema.Property;
import com.baidu.hugegraph.entity.schema.PropertyIndex;
import com.baidu.hugegraph.entity.schema.SchemaType;
import com.baidu.hugegraph.entity.schema.VertexLabelEntity;
import com.baidu.hugegraph.exception.ExternalException;
import com.baidu.hugegraph.exception.ServerException;
import com.baidu.hugegraph.structure.schema.EdgeLabel;
import com.baidu.hugegraph.structure.schema.IndexLabel;
import com.baidu.hugegraph.structure.schema.PropertyKey;
import com.baidu.hugegraph.structure.schema.VertexLabel;
import com.baidu.hugegraph.util.Ex;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
public class VertexLabelService extends SchemaService {

    @Autowired
    private PropertyKeyService pkService;
    @Autowired
    private PropertyIndexService piService;

    public List<VertexLabelEntity> list(int connId) {
        return this.list(Collections.emptyList(), connId);
    }

    public List<VertexLabelEntity> list(List<String> names, int connId) {
        HugeClient client = this.client(connId);
        List<VertexLabel> vertexLabels;
        if (CollectionUtils.isEmpty(names)) {
            vertexLabels = client.schema().getVertexLabels();
        } else {
            vertexLabels = client.schema().getVertexLabels(names);
        }
        List<IndexLabel> indexLabels = client.schema().getIndexLabels();

        List<VertexLabelEntity> results = new ArrayList<>(vertexLabels.size());
        vertexLabels.forEach(vertexLabel -> {
            results.add(convert(vertexLabel, indexLabels));
        });
        return results;
    }

    public VertexLabelEntity get(String name, int connId) {
        HugeClient client = this.client(connId);
        try {
            VertexLabel vertexLabel = client.schema().getVertexLabel(name);
            List<IndexLabel> indexLabels = client.schema().getIndexLabels();
            return convert(vertexLabel, indexLabels);
        } catch (ServerException e) {
            if (e.status() == Constant.STATUS_NOT_FOUND) {
                return null;
            }
            throw e;
        }
    }

    public List<String> linkEdgeLabels(String name, int connId) {
        HugeClient client = this.client(connId);
        List<EdgeLabel> edgeLabels = client.schema().getEdgeLabels();
        List<String> results = new ArrayList<>();
        for (EdgeLabel edgeLabel : edgeLabels) {
            if (edgeLabel.linkedVertexLabel(name)) {
                results.add(edgeLabel.name());
            }
        }
        return results;
    }

    public void add(VertexLabelEntity entity, int connId) {
        HugeClient client = this.client(connId);
        VertexLabel vertexLabel = convert(entity, client);
        client.schema().addVertexLabel(vertexLabel);

        List<IndexLabel> indexLabels = collectIndexLabels(entity, client);
        // Remove vertex label if create index labels failed
        try {
            this.piService.atomicAddBatch(indexLabels, client);
        } catch (Exception e) {
            client.schema().removeVertexLabel(vertexLabel.name());
            throw new ExternalException("schema.vertexlabel.create.failed", e,
                                        entity.getName());
        }
    }

    public void update(LabelUpdateEntity entity, int connId) {
        HugeClient client = this.client(connId);
        entity.setType(SchemaType.VERTEX_LABEL);
        VertexLabel vertexLabel = convert(entity, client);
        client.schema().appendVertexLabel(vertexLabel);

        List<IndexLabel> addedIndexLabels = collectIndexLabels(entity, client);
        try {
            this.piService.atomicAddBatch(addedIndexLabels, client);
        } catch (Exception e) {
            client.schema().eliminateVertexLabel(vertexLabel);
            throw new ExternalException("schema.vertexlabel.update.failed", e,
                                        entity.getName());
        }

        List<IndexLabel> removedIndexLabels;
        removedIndexLabels = convert(entity.getRemovePropertyIndexes(), client);
        try {
            this.piService.atomicRemoveBatch(removedIndexLabels, client);
        } catch (Exception e) {
            this.piService.removeBatch(collectNames(addedIndexLabels), client);
            client.schema().eliminateVertexLabel(vertexLabel);
            throw new ExternalException("schema.vertexlabel.update.failed", e,
                                        entity.getName());
        }
    }

    public void remove(String name, int connId) {
        HugeClient client = this.client(connId);
        client.schema().removeVertexLabel(name);
    }

    public boolean exist(String name, int connId) {
        return this.get(name, connId) != null;
    }

    public boolean checkUsing(String name, int connId) {
        HugeClient client = this.client(connId);
        List<EdgeLabel> edgeLabels = client.schema().getEdgeLabels();
        for (EdgeLabel edgeLabel : edgeLabels) {
            if (edgeLabel.linkedVertexLabel(name)) {
                return true;
            }
        }
        return false;
    }

    public ConflictDetail checkConflict(List<String> names,
                                        int reusedConnId, int connId) {
        ConflictDetail detail = new ConflictDetail();
        if (names.isEmpty()) {
            return detail;
        }

        HugeClient reusedClient = this.client(reusedConnId);
        HugeClient targetClient = this.client(connId);

        List<VertexLabel> reusedVertexLabels;
        reusedVertexLabels = reusedClient.schema().getVertexLabels(names);
        Map<String, VertexLabel> oldVertexLabels = new HashMap<>();
        targetClient.schema().getVertexLabels().forEach(vl -> {
            oldVertexLabels.put(vl.name(), vl);
        });

        detail.merge(checkPropertyKeyConflict(this.pkService, reusedVertexLabels,
                                              reusedConnId, connId));
        // Collect all index labels to avoid multi get
        Map<String, List<IndexLabel>> relatedIndexLabels;
        relatedIndexLabels = collectReleatedIndexLabels(names, true,
                                                        reusedClient);
        detail.merge(checkPropertyIndexConflict(this.piService,
                                                relatedIndexLabels.values(),
                                                connId));

        for (VertexLabel reusedVertexLabel : reusedVertexLabels) {
            String name = reusedVertexLabel.name();
            // Firstly determine if any properties are conflicted
            if (detail.anyPropertyKeyConflict(reusedVertexLabel.properties())) {
                detail.put(SchemaType.VERTEX_LABEL, name, ConflictStatus.DUPNAME);
                continue;
            }
            // Then determine if any property indexes are conflicted
            if (detail.anyPropertyIndexConflict(relatedIndexLabels.get(name))) {
                detail.put(SchemaType.VERTEX_LABEL, name, ConflictStatus.DUPNAME);
                continue;
            }
            // Last check conflict of vertex label itself
            VertexLabel oldVertexLabel = oldVertexLabels.get(name);
            if (oldVertexLabel == null) {
                detail.put(SchemaType.VERTEX_LABEL, name, ConflictStatus.PASSED);
            } else if (isEqual(reusedVertexLabel, oldVertexLabel)) {
                detail.put(SchemaType.VERTEX_LABEL, name, ConflictStatus.EXISTED);
            } else {
                detail.put(SchemaType.VERTEX_LABEL, name, ConflictStatus.DUPNAME);
            }
        }
        return detail;
    }

    public void reuse(List<String> names, int reusedConnId, int connId) {
        ConflictDetail detail = this.checkConflict(names, reusedConnId, connId);
        Ex.check(!detail.hasConflict(), "schema.cannot-reuse-conflict");

        HugeClient reusedClient = this.client(reusedConnId);
        SchemaManager reusedSchema = reusedClient.schema();
        HugeClient targetClient = this.client(connId);

        List<PropertyKey> propertyKeys = null;
        List<String> pkNames = detail.filter(SchemaType.PROPERTY_KEY);
        if (!pkNames.isEmpty()) {
            propertyKeys = reusedSchema.getPropertyKeys(pkNames);
            try {
                this.pkService.atomicAddBatch(propertyKeys, targetClient);
            } catch (Exception e) {
                throw new ExternalException("schema.propertykey.reuse.failed");
            }
        }

        List<VertexLabel> vertexLabels = null;
        List<String> vlNames = detail.filter(SchemaType.VERTEX_LABEL);
        if (!vlNames.isEmpty()) {
            vertexLabels = reusedSchema.getVertexLabels(vlNames);
            try {
                this.atomicAddBatch(vertexLabels, targetClient);
            } catch (Exception e) {
                this.pkService.removeBatch(propertyKeys, targetClient);
                throw new ExternalException("schema.vertexlabel.reuse.failed");
            }
        }

        List<String> ilNames = detail.filter(SchemaType.PROPERTY_INDEX);
        if (!ilNames.isEmpty()) {
            List<IndexLabel> indexLabels = reusedSchema.getIndexLabels(ilNames);
            try {
                this.piService.atomicAddBatch(indexLabels, targetClient);
            } catch (Exception e) {
                this.removeBatch(vertexLabels, targetClient);
                this.pkService.removeBatch(propertyKeys, targetClient);
                throw new ExternalException("schema.propertyindex.reuse.failed");
            }
        }
    }

    public void atomicAddBatch(List<VertexLabel> vertexLabels,
                               HugeClient client) throws Exception {
        atomicAddBatch(vertexLabels, client,
                       (c, vl) -> c.schema().addVertexLabel(vl),
                       (c, n) -> c.schema().removeVertexLabel(n),
                       SchemaType.VERTEX_LABEL);
    }

    public void removeBatch(List<VertexLabel> vertexLabels, HugeClient client) {
        removeBatch(collectNames(vertexLabels), client,
                    (c, n) -> c.schema().removeVertexLabel(n),
                    SchemaType.VERTEX_LABEL);
    }

    private static VertexLabelEntity convert(VertexLabel vertexLabel,
                                             List<IndexLabel> indexLabels) {
        Set<Property> properties = collectProperties(vertexLabel);
        List<PropertyIndex> propertyIndexes = collectPropertyIndexes(vertexLabel,
                                                                     indexLabels);
        return VertexLabelEntity.builder()
                                .name(vertexLabel.name())
                                .properties(properties)
                                .idStrategy(vertexLabel.idStrategy())
                                .primaryKeys(vertexLabel.primaryKeys())
                                .propertyIndexes(propertyIndexes)
                                .openLabelIndex(vertexLabel.enableLabelIndex())
                                .style(getSchemaStyle(vertexLabel))
                                .createTime(getCreateTime(vertexLabel))
                                .build();
    }

    private static VertexLabel convert(VertexLabelEntity entity,
                                       HugeClient client) {
        return client.schema().vertexLabel(entity.getName())
                     .idStrategy(entity.getIdStrategy())
                     .properties(toStringArray(entity.getPropNames()))
                     .primaryKeys(toStringArray(entity.getPrimaryKeys()))
                     .nullableKeys(toStringArray(entity.getNullableProps()))
                     .enableLabelIndex(entity.isOpenLabelIndex())
                     .userdata(USER_KEY_CREATE_TIME, entity.getCreateTime())
                     .userdata(USER_KEY_ICON, entity.getStyle().getIcon())
                     .userdata(USER_KEY_COLOR, entity.getStyle().getColor())
                     .build();
    }

    private static VertexLabel convert(LabelUpdateEntity entity,
                                       HugeClient client) {
        Set<String> properties = new HashSet<>();
        if (entity.getAppendProperties() != null) {
            entity.getAppendProperties().forEach(p -> {
                properties.add(p.getName());
            });
        }
        return client.schema().vertexLabel(entity.getName())
                     .properties(toStringArray(properties))
                     .nullableKeys(toStringArray(properties))
                     .userdata(USER_KEY_ICON, entity.getStyle().getIcon())
                     .userdata(USER_KEY_COLOR, entity.getStyle().getColor())
                     .build();
    }

    private static boolean isEqual(VertexLabel oldSchema,
                                   VertexLabel newSchema) {
        return oldSchema.name().equals(newSchema.name()) &&
               oldSchema.idStrategy().equals(newSchema.idStrategy()) &&
               oldSchema.properties().equals(newSchema.properties()) &&
               oldSchema.primaryKeys().equals(newSchema.primaryKeys()) &&
               oldSchema.nullableKeys().equals(newSchema.nullableKeys()) &&
               oldSchema.enableLabelIndex() == newSchema.enableLabelIndex();
    }
}
