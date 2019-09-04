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
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import com.baidu.hugegraph.config.HugeConfig;
import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.driver.SchemaManager;
import com.baidu.hugegraph.entity.schema.ConflictDetail;
import com.baidu.hugegraph.entity.schema.LabelUpdateEntity;
import com.baidu.hugegraph.entity.schema.Property;
import com.baidu.hugegraph.entity.schema.PropertyIndex;
import com.baidu.hugegraph.entity.schema.SchemaLabelEntity;
import com.baidu.hugegraph.entity.schema.SchemaStyle;
import com.baidu.hugegraph.entity.schema.SchemaType;
import com.baidu.hugegraph.service.HugeClientPoolService;
import com.baidu.hugegraph.structure.SchemaElement;
import com.baidu.hugegraph.structure.constant.HugeType;
import com.baidu.hugegraph.structure.schema.IndexLabel;
import com.baidu.hugegraph.structure.schema.SchemaLabel;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
public class SchemaService {

    public static final String USER_KEY_CREATE_TIME = "~create_time";
    public static final String USER_KEY_ICON = "~icon";
    public static final String USER_KEY_COLOR = "~color";

    @Autowired
    private HugeConfig config;
    @Autowired
    private HugeClientPoolService poolService;

    public HugeConfig config() {
        return this.config;
    }

    public HugeClient client(int connId) {
        return this.poolService.getOrCreate(connId);
    }

    public static <T extends SchemaElement> List<String> collectNames(
                                                         List<T> schemas) {
        return schemas.stream().map(SchemaElement::name)
                      .collect(Collectors.toList());
    }

    public static Set<Property> collectProperties(SchemaLabel schemaLabel) {
        Set<Property> properties = new HashSet<>();
        Set<String> nullableKeys = schemaLabel.nullableKeys();
        for (String property : schemaLabel.properties()) {
            boolean nullable = nullableKeys.contains(property);
            properties.add(new Property(property, nullable));
        }
        return properties;
    }

    public static List<PropertyIndex> collectPropertyIndexes(
                                      SchemaLabel schemaLabel,
                                      List<IndexLabel> indexLabels) {
        List<PropertyIndex> propertyIndexes = new ArrayList<>();
        for (IndexLabel indexLabel : indexLabels) {
            if (indexLabel.baseValue().equals(schemaLabel.name())) {
                PropertyIndex propertyIndex;
                propertyIndex = new PropertyIndex(indexLabel.baseValue(),
                                                  indexLabel.name(),
                                                  indexLabel.indexType(),
                                                  indexLabel.indexFields());
                propertyIndexes.add(propertyIndex);
            }
        }
        return propertyIndexes;
    }

    public static List<IndexLabel> convert(List<String> names,
                                           HugeClient client) {
        if (CollectionUtils.isEmpty(names)) {
            return Collections.emptyList();
        } else {
            return client.schema().getIndexLabels(names);
        }
    }

    public static List<IndexLabel> collectIndexLabels(SchemaLabelEntity entity,
                                                      HugeClient client) {
        List<PropertyIndex> propertyIndexes = entity.getPropertyIndexes();
        boolean isVertex = entity.getType().isVertexLabel();
        return convert(propertyIndexes, client, isVertex, entity.getName());
    }

    public static List<IndexLabel> collectIndexLabels(LabelUpdateEntity entity,
                                                      HugeClient client) {
        List<PropertyIndex> propertyIndexes = entity.getAppendPropertyIndexes();
        boolean isVertex = entity.getType().isVertexLabel();
        return convert(propertyIndexes, client, isVertex, entity.getName());
    }

    private static List<IndexLabel> convert(List<PropertyIndex> propertyIndexes,
                                            HugeClient client,
                                            boolean isVertex, String baseValue) {
        if (CollectionUtils.isEmpty(propertyIndexes)) {
            return Collections.emptyList();
        }

        SchemaManager schema = client.schema();
        List<IndexLabel> indexLabels = new ArrayList<>(propertyIndexes.size());
        for (PropertyIndex index : propertyIndexes) {
            String[] fields = toStringArray(index.getFields());
            IndexLabel indexLabel = schema.indexLabel(index.getName())
                                          .on(isVertex, baseValue)
                                          .indexType(index.getType())
                                          .by(fields)
                                          .build();
            indexLabels.add(indexLabel);
        }
        return indexLabels;
    }

    public static Map<String, List<IndexLabel>> collectReleatedIndexLabels(
                                                List<String> names,
                                                boolean isVertex,
                                                HugeClient client) {
        HugeType type = isVertex ? HugeType.VERTEX_LABEL : HugeType.EDGE_LABEL;
        Map<String, List<IndexLabel>> results = new HashMap<>();
        List<IndexLabel> allIndexLabels = client.schema().getIndexLabels();
        for (IndexLabel indexLabel : allIndexLabels) {
            if (indexLabel.baseType() != type) {
                continue;
            }
            for (String name : names) {
                if (name.equals(indexLabel.baseValue())) {
                    List<IndexLabel> indexLabels = results.computeIfAbsent(
                                                   name, k -> new ArrayList<>());
                    indexLabels.add(indexLabel);
                    break;
                }
            }
        }
        return results;
    }

    public static <T extends SchemaLabel>
           ConflictDetail checkPropertyKeyConflict(PropertyKeyService service,
                                                   List<T> schemas,
                                                   int reusedConnId,
                                                   int connId) {
        ConflictDetail detail = new ConflictDetail();
        Set<String> pkNames = new HashSet<>();
        schemas.forEach(vl -> pkNames.addAll(vl.properties()));
        if (!pkNames.isEmpty()) {
            detail.merge(service.checkConflict(new ArrayList<>(pkNames),
                                               reusedConnId, connId));
        }
        return detail;
    }

    public static ConflictDetail checkPropertyIndexConflict(
                                 PropertyIndexService service,
                                 Collection<List<IndexLabel>> schemas,
                                 int connId) {
        ConflictDetail detail = new ConflictDetail();
        for (List<IndexLabel> indexLabels : schemas) {
            detail.merge(service.checkConflict(indexLabels, connId));
        }
        return detail;
    }

    public static <T extends SchemaElement>
           void atomicAddBatch(List<T> schemas, HugeClient client,
                               BiConsumer<HugeClient, T> createFunc,
                               BiConsumer<HugeClient, String> removeFunc,
                               SchemaType type) throws Exception {
        int addingIdx = 0;
        Date now = new Date();
        try {
            for (addingIdx = 0; addingIdx < schemas.size(); addingIdx++) {
                T schema = schemas.get(addingIdx);
                schema.resetId();
                if (!(schema instanceof IndexLabel)) {
                    schema.userdata().put(USER_KEY_CREATE_TIME, now);
                }
                createFunc.accept(client, schema);
            }
        } catch (Exception e) {
            for (int i = addingIdx - 1; i >= 0; i--) {
                String name = schemas.get(i).name();
                try {
                    removeFunc.accept(client, name);
                } catch (Exception ex) {
                    log.error("Failed to remove {} {}", type.string(), name, ex);
                }
            }
            throw e;
        }
    }

    public static <T extends SchemaElement>
           void atomicRemoveBatch(List<T> schemas, HugeClient client,
                                  BiConsumer<HugeClient, String> removeFunc,
                                  BiConsumer<HugeClient, T> createFunc,
                                  SchemaType type) throws Exception {
        int removingIdx = 0;
        try {
            for (removingIdx = 0; removingIdx < schemas.size(); removingIdx++) {
                T schema = schemas.get(removingIdx);
                removeFunc.accept(client, schema.name());
            }
        } catch (Exception e) {
            for (int i = removingIdx - 1; i >= 0; i--) {
                T schema = schemas.get(i);
                try {
                    createFunc.accept(client, schema);
                } catch (Exception ex) {
                    log.error("Failed to create {} {}", type.string(),
                              schema.name(), ex);
                }
            }
            throw e;
        }
    }

    public static void removeBatch(List<String> names, HugeClient client,
                                   BiConsumer<HugeClient, String> removeFunc,
                                   SchemaType type) {
        if (names == null) {
            return;
        }
        for (String name : names) {
            try {
                removeFunc.accept(client, name);
            } catch (Exception e) {
                log.error("Failed to remove {} {}", type.string(), name, e);
            }
        }
    }

    public static SchemaStyle getSchemaStyle(SchemaElement element) {
        String icon = (String) element.userdata().get(USER_KEY_ICON);
        String color = (String) element.userdata().get(USER_KEY_COLOR);
        return new SchemaStyle(icon, color);
    }

    public static Date getCreateTime(SchemaElement element) {
        Object createTimeValue = element.userdata().get(USER_KEY_CREATE_TIME);
        if (createTimeValue == null) {
            return new Date();
        }
        return new Date((long) createTimeValue);
    }

    public static String[] toStringArray(Collection<String> collection) {
        if (collection == null || collection.isEmpty()) {
            return new String[]{};
        }
        return collection.toArray(new String[]{});
    }
}
