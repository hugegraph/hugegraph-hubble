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
import java.util.Collection;
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
import com.baidu.hugegraph.entity.schema.ConflictDetail;
import com.baidu.hugegraph.entity.schema.ConflictStatus;
import com.baidu.hugegraph.entity.schema.LabelUpdateEntity;
import com.baidu.hugegraph.entity.schema.ConflictCheckEntity;
import com.baidu.hugegraph.entity.schema.Property;
import com.baidu.hugegraph.entity.schema.PropertyIndex;
import com.baidu.hugegraph.entity.schema.SchemaConflict;
import com.baidu.hugegraph.entity.schema.SchemaEntity;
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

    public List<VertexLabelEntity> list(Collection<String> names, int connId) {
        return this.list(names, connId, true);
    }

    public List<VertexLabelEntity> list(Collection<String> names, int connId,
                                        boolean emptyAsAll) {
        HugeClient client = this.client(connId);
        List<VertexLabel> vertexLabels;
        if (CollectionUtils.isEmpty(names)) {
            if (emptyAsAll) {
                vertexLabels = client.schema().getVertexLabels();
            } else {
                vertexLabels = new ArrayList<>();
            }
        } else {
            vertexLabels = client.schema().getVertexLabels(new ArrayList<>(names));
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
        VertexLabel vertexLabel = convert(entity, client);

        // All existed indexlabels
        List<IndexLabel> existedIndexLabels = client.schema().getIndexLabels();
        List<String> existedIndexLabelNames = collectNames(existedIndexLabels);

        List<String> addedIndexLabelNames = entity.getAppendPropertyIndexNames();
        List<IndexLabel> addedIndexLabels = convertIndexLabels(
                                            entity.getAppendPropertyIndexes(),
                                            client, true, entity.getName());

        List<String> removedIndexLabelNames = entity.getRemovePropertyIndexes();
        List<IndexLabel> removedIndexLabels = collectIndexLabels(
                                              removedIndexLabelNames, client);

        if (addedIndexLabelNames != null) {
            for (String name : addedIndexLabelNames) {
                if (existedIndexLabelNames.contains(name)) {
                    throw new ExternalException(
                            "schema.vertexlabel.update.append-index-existed",
                            entity.getName(), name);
                }
            }
        }
        if (removedIndexLabelNames != null) {
            for (String name : removedIndexLabelNames) {
                if (!existedIndexLabelNames.contains(name)) {
                    throw new ExternalException(
                            "schema.vertexlabel.update.remove-index-unexisted",
                            entity.getName(), name);
                }
            }
        }

        // NOTE: property can append but doesn't support eliminate now
        client.schema().appendVertexLabel(vertexLabel);

        try {
            this.piService.atomicAddBatch(addedIndexLabels, client);
        } catch (Exception e) {
            // client.schema().eliminateVertexLabel(vertexLabel);
            throw new ExternalException("schema.vertexlabel.update.failed", e,
                                        entity.getName());
        }

        try {
            this.piService.atomicRemoveBatch(removedIndexLabels, client);
        } catch (Exception e) {
            this.piService.removeBatch(addedIndexLabelNames, client);
            // client.schema().eliminateVertexLabel(vertexLabel);
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

    public ConflictDetail checkConflict(ConflictCheckEntity entity,
                                        int connId, boolean compareEachOther) {
        ConflictDetail detail = new ConflictDetail(SchemaType.VERTEX_LABEL);
        if (CollectionUtils.isEmpty(entity.getVlEntities())) {
            return detail;
        }

        this.pkService.checkConflict(entity.getPkEntities(), detail,
                                     connId, compareEachOther);
        this.piService.checkConflict(entity.getPiEntities(), detail,
                                     connId, compareEachOther);
        this.checkConflict(entity.getVlEntities(), detail,
                           connId, compareEachOther);
        return detail;
    }

    public void checkConflict(List<VertexLabelEntity> entities,
                              ConflictDetail detail, int connId,
                              boolean compareEachOther) {
        if (CollectionUtils.isEmpty(entities)) {
            return;
        }

        Map<String, VertexLabelEntity> originEntities = new HashMap<>();
        for (VertexLabelEntity entity : this.list(connId)) {
            originEntities.put(entity.getName(), entity);
        }
        for (VertexLabelEntity entity : entities) {
            if (detail.anyPropertyKeyConflict(entity.getPropNames())) {
                detail.add(entity, ConflictStatus.DUPNAME);
                continue;
            }
            if (detail.anyPropertyIndexConflict(entity.getIndexProps())) {
                detail.add(entity, ConflictStatus.DUPNAME);
                continue;
            }
            VertexLabelEntity originEntity = originEntities.get(entity.getName());
            ConflictStatus status = SchemaEntity.compare(entity, originEntity);
            detail.add(entity, status);
        }
        // Compare resued entities with each other
        if (compareEachOther) {
            compareWithEachOther(detail, SchemaType.VERTEX_LABEL);
        }
    }

    public void reuse(ConflictDetail detail, int connId) {
        // Assume that the conflict detail is valid
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

        List<VertexLabel> vertexLabels = this.filter(detail, client);
        // Filter propertykeys and propertyindexes
        if (!vertexLabels.isEmpty()) {
            try {
                this.atomicAddBatch(vertexLabels, client);
            } catch (Exception e) {
                this.pkService.removeBatch(propertyKeys, client);
                throw new ExternalException("schema.vertexlabel.reuse.failed", e);
            }
        }

        List<IndexLabel> indexLabels = this.piService.filter(detail, client);
        if (!indexLabels.isEmpty()) {
            try {
                this.piService.atomicAddBatch(indexLabels, client);
            } catch (Exception e) {
                this.removeBatch(vertexLabels, client);
                this.pkService.removeBatch(propertyKeys, client);
                throw new ExternalException("schema.propertyindex.reuse.failed", e);
            }
        }
    }

    public List<VertexLabel> filter(ConflictDetail detail, HugeClient client) {
        return detail.getVlConflicts().stream()
                     .filter(c -> c.getStatus() == ConflictStatus.PASSED)
                     .map(SchemaConflict::getEntity)
                     .map(e -> convert(e, client))
                     .collect(Collectors.toList());
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
        if (vertexLabel == null) {
            return null;
        }
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
        if (entity == null) {
            return null;
        }
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
}
