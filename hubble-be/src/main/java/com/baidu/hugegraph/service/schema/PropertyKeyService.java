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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.entity.schema.ConflictDetail;
import com.baidu.hugegraph.entity.schema.ConflictStatus;
import com.baidu.hugegraph.entity.schema.PropertyKeyEntity;
import com.baidu.hugegraph.entity.schema.SchemaConflict;
import com.baidu.hugegraph.entity.schema.SchemaType;
import com.baidu.hugegraph.exception.ExternalException;
import com.baidu.hugegraph.exception.ServerException;
import com.baidu.hugegraph.structure.schema.EdgeLabel;
import com.baidu.hugegraph.structure.schema.PropertyKey;
import com.baidu.hugegraph.structure.schema.VertexLabel;
import com.baidu.hugegraph.util.Ex;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
public class PropertyKeyService extends SchemaService {

    public List<PropertyKeyEntity> list(int connId) {
        return this.list(Collections.emptyList(), connId);
    }

    public List<PropertyKeyEntity> list(List<String> names, int connId) {
        HugeClient client = this.client(connId);
        List<PropertyKey> propertyKeys;
        if (CollectionUtils.isEmpty(names)) {
            propertyKeys = client.schema().getPropertyKeys();
        } else {
            propertyKeys = client.schema().getPropertyKeys(names);
        }
        List<PropertyKeyEntity> results = new ArrayList<>(propertyKeys.size());
        propertyKeys.forEach(propertyKey -> {
            results.add(convert(propertyKey));
        });
        return results;
    }

    public PropertyKeyEntity get(String name, int connId) {
        HugeClient client = this.client(connId);
        try {
            PropertyKey propertyKey = client.schema().getPropertyKey(name);
            return convert(propertyKey);
        } catch (ServerException e) {
            if (e.status() == Constant.STATUS_NOT_FOUND) {
                // return null if does not exist
                return null;
            }
            throw e;
        }
    }

    public void add(PropertyKeyEntity entity, int connId) {
        HugeClient client = this.client(connId);
        PropertyKey propertyKey = convert(entity, client);
        client.schema().addPropertyKey(propertyKey);
    }

    public void remove(String name, int connId) {
        HugeClient client = this.client(connId);
        client.schema().removePropertyKey(name);
    }

    public boolean exist(String name, int connId) {
        return this.get(name, connId) != null;
    }

    /**
     * Check the property key is being used, used means that there is
     * any vertex label or edge label contains the property(name)
     */
    public boolean checkUsing(String name, int connId) {
        HugeClient client = this.client(connId);
        List<VertexLabel> vertexLabels = client.schema().getVertexLabels();
        for (VertexLabel vertexLabel : vertexLabels) {
            if (vertexLabel.properties().contains(name)) {
                return true;
            }
        }
        List<EdgeLabel> edgeLabels = client.schema().getEdgeLabels();
        for (EdgeLabel edgeLabel : edgeLabels) {
            if (edgeLabel.properties().contains(name)) {
                return true;
            }
        }
        return false;
    }

    public ConflictDetail checkConflict(List<String> names, int reusedConnId,
                                        int connId) {
        ConflictDetail detail = new ConflictDetail(SchemaType.PROPERTY_KEY);
        if (names.isEmpty()) {
            return detail;
        }

        HugeClient reusedClient = this.client(reusedConnId);
        HugeClient targetClient = this.client(connId);

        // Collect reused and origin propertykeys
        List<PropertyKey> reusedPropertyKeys = reusedClient.schema()
                                                           .getPropertyKeys(names);
        Map<String, PropertyKey> originPropertyKeys = new HashMap<>();
        targetClient.schema().getPropertyKeys().forEach(pk -> {
            originPropertyKeys.put(pk.name(), pk);
        });

        for (PropertyKey reusedPropertyKey : reusedPropertyKeys) {
            String name = reusedPropertyKey.name();
            PropertyKey originPropertyKey = originPropertyKeys.get(name);

            PropertyKeyEntity entity = convert(reusedPropertyKey);
            ConflictStatus status;
            if (originPropertyKey == null) {
                status = ConflictStatus.PASSED;
            } else if (equals(reusedPropertyKey, originPropertyKey)) {
                status = ConflictStatus.EXISTED;
            } else {
                status = ConflictStatus.DUPNAME;
            }
            detail.add(entity, status);
        }
        return detail;
    }

    public ConflictStatus checkConflict(PropertyKeyEntity entity, int connId) {
        HugeClient client = this.client(connId);
        String name = entity.getName();
        PropertyKey reusedPropertyKey = convert(entity, client);
        PropertyKey originPropertyKey = convert(this.get(name, connId), client);
        if (originPropertyKey == null) {
            return ConflictStatus.PASSED;
        } else if (equals(reusedPropertyKey, originPropertyKey)) {
            return ConflictStatus.EXISTED;
        } else {
            return ConflictStatus.DUPNAME;
        }
    }

    public void reuse(ConflictDetail detail, int connId) {
        // Assume that the conflict detail is valid
        Ex.check(!detail.hasConflict(), "schema.cannot-reuse-conflict");
        HugeClient client = this.client(connId);

        List<PropertyKey> propertyKeys = this.filter(detail, client);
        if (propertyKeys.isEmpty()) {
            return;
        }
        try {
            this.atomicAddBatch(propertyKeys, client);
        } catch (Exception e) {
            throw new ExternalException("schema.propertykey.reuse.failed", e);
        }
    }

    public List<PropertyKey> filter(ConflictDetail detail, HugeClient client) {
        return detail.getPropertyKeyConflicts().stream()
                     .filter(c -> c.getStatus() == ConflictStatus.PASSED)
                     .map(SchemaConflict::getEntity)
                     .map(e -> convert(e, client))
                     .collect(Collectors.toList());
    }

    public void atomicAddBatch(List<PropertyKey> propertyKeys,
                               HugeClient client) throws Exception {
        atomicAddBatch(propertyKeys, client,
                       (c, pk) -> c.schema().addPropertyKey(pk),
                       (c, n) -> c.schema().removePropertyKey(n),
                       SchemaType.PROPERTY_KEY);
    }

    public void removeBatch(List<PropertyKey> propertyKeys, HugeClient client) {
        removeBatch(collectNames(propertyKeys), client,
                    (c, n) -> c.schema().removePropertyKey(n),
                    SchemaType.PROPERTY_KEY);
    }

    private static PropertyKeyEntity convert(PropertyKey propertyKey) {
        if (propertyKey == null) {
            return null;
        }
        return PropertyKeyEntity.builder()
                                .name(propertyKey.name())
                                .dataType(propertyKey.dataType())
                                .cardinality(propertyKey.cardinality())
                                .createTime(getCreateTime(propertyKey))
                                .build();
    }

    private static PropertyKey convert(PropertyKeyEntity entity,
                                       HugeClient client) {
        if (entity == null) {
            return null;
        }
        return client.schema()
                     .propertyKey(entity.getName())
                     .dataType(entity.getDataType())
                     .cardinality(entity.getCardinality())
                     .userdata(USER_KEY_CREATE_TIME, entity.getCreateTime())
                     .build();
    }

    private static boolean equals(PropertyKey oldSchema, PropertyKey newSchema) {
        return oldSchema.name().equals(newSchema.name()) &&
               oldSchema.dataType().equals(newSchema.dataType()) &&
               oldSchema.cardinality().equals(newSchema.cardinality());
    }
}