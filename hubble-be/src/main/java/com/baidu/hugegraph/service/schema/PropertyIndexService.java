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
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import com.baidu.hugegraph.driver.HugeClient;
import com.baidu.hugegraph.entity.schema.ConflictDetail;
import com.baidu.hugegraph.entity.schema.ConflictStatus;
import com.baidu.hugegraph.entity.schema.PropertyIndex;
import com.baidu.hugegraph.entity.schema.SchemaType;
import com.baidu.hugegraph.structure.constant.HugeType;
import com.baidu.hugegraph.structure.schema.IndexLabel;
import com.baidu.hugegraph.util.PageUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
public class PropertyIndexService extends SchemaService {

    public List<PropertyIndex> list(List<String> names, int connId) {
        HugeClient client = this.client(connId);
        List<IndexLabel> indexLabels;
        if (CollectionUtils.isEmpty(names)) {
            indexLabels = client.schema().getIndexLabels();
        } else {
            indexLabels = client.schema().getIndexLabels(names);
        }
        List<PropertyIndex> results = new ArrayList<>(indexLabels.size());
        indexLabels.forEach(indexLabel -> {
            results.add(convert(indexLabel));
        });
        return results;
    }

    public IPage<PropertyIndex> listPropertyIndex(int connId, HugeType type,
                                                  int pageNo, int pageSize) {
        HugeClient client = this.client(connId);
        List<IndexLabel> indexLabels = client.schema().getIndexLabels();

        List<PropertyIndex> results = new ArrayList<>();
        for (IndexLabel indexLabel : indexLabels) {
            if (!indexLabel.baseType().equals(type)) {
                continue;
            }
            // Collect all indexlabels
            results.add(convert(indexLabel));
        }
        return PageUtil.page(results, pageNo, pageSize);
    }

    /**
     * The sort result like that, content is 'name'
     * --------------+------------------------+---------------------------------
     * base_value    | index label name       | fields
     * --------------+------------------------+---------------------------------
     * xxxname       | xxxByName              | name
     * --------------+------------------------+---------------------------------
     *               | personByName           | name
     * person        +------------------------+---------------------------------
     *               | personByAgeAndName     | age name
     * --------------+------------------------+---------------------------------
     *               | softwareByName         | name
     * software      +------------------------+---------------------------------
     *               | softwareByPriveAndName | price name
     * --------------+------------------------+---------------------------------
     */
    public IPage<PropertyIndex> listPropertyIndex(int connId, HugeType type,
                                                  String content,
                                                  int pageNo, int pageSize) {
        HugeClient client = this.client(connId);
        List<IndexLabel> indexLabels = client.schema().getIndexLabels();

        Map<String, List<PropertyIndex>> matchedResults = new HashMap<>();
        Map<String, List<PropertyIndex>> unMatchedResults = new HashMap<>();
        for (IndexLabel indexLabel : indexLabels) {
            if (!indexLabel.baseType().equals(type)) {
                continue;
            }
            String baseValue = indexLabel.baseValue();
            List<PropertyIndex> groupedIndexes;
            // Collect indexlabels that contains content
            boolean match = baseValue.contains(content);
            if (match) {
                groupedIndexes = matchedResults.computeIfAbsent(baseValue,
                                                k -> new ArrayList<>());
            } else {
                groupedIndexes = unMatchedResults.computeIfAbsent(baseValue,
                                                  k -> new ArrayList<>());
            }
            match = indexLabel.name().contains(content) ||
                    indexLabel.indexFields().stream()
                              .anyMatch(f -> f.contains(content));
            if (match) {
                groupedIndexes.add(convert(indexLabel));
            }
        }

        // Sort results by relevance
        if (!StringUtils.isEmpty(content)) {
            for (Map.Entry<String, List<PropertyIndex>> entry :
                 matchedResults.entrySet()) {
                List<PropertyIndex> groupedIndexes = entry.getValue();
                groupedIndexes.sort(new Comparator<PropertyIndex>() {
                    final int highScore = 2;
                    final int lowScore = 1;
                    @Override
                    public int compare(PropertyIndex o1, PropertyIndex o2) {
                        int o1Score = 0;
                        if (o1.getName().contains(content)) {
                            o1Score += highScore;
                        }
                        if (o1.getFields().stream()
                              .anyMatch(field -> field.contains(content))) {
                            o1Score += lowScore;
                        }

                        int o2Score = 0;
                        if (o2.getName().contains(content)) {
                            o2Score += highScore;
                        }
                        if (o2.getFields().stream()
                              .anyMatch(field -> field.contains(content))) {
                            o2Score += lowScore;
                        }
                        return o2Score - o1Score;
                    }
                });
            }
        }
        List<PropertyIndex> all = new ArrayList<>();
        matchedResults.values().forEach(all::addAll);
        unMatchedResults.values().forEach(all::addAll);
        return PageUtil.page(all, pageNo, pageSize);
    }

    public void atomicAddBatch(List<IndexLabel> indexLabels,
                               HugeClient client) throws Exception {
        atomicAddBatch(indexLabels, client,
                       (c, il) -> c.schema().addIndexLabel(il),
                       (c, n) -> c.schema().removeIndexLabel(n),
                       SchemaType.PROPERTY_INDEX);
    }

    public void atomicRemoveBatch(List<IndexLabel> indexLabels,
                                  HugeClient client) throws Exception {
        atomicRemoveBatch(indexLabels, client,
                          (c, n) -> c.schema().removeIndexLabel(n),
                          (c, il) -> c.schema().addIndexLabel(il),
                          SchemaType.PROPERTY_INDEX);
    }

    public void removeBatch(List<String> indexLabels, HugeClient client) {
        removeBatch(indexLabels, client,
                    (c, n) -> c.schema().removeIndexLabel(n),
                    SchemaType.PROPERTY_INDEX);
    }

    public ConflictDetail checkConflict(List<IndexLabel> indexLabels,
                                        int connId) {
        HugeClient client = this.client(connId);
        Map<String, IndexLabel> oldIndexLabels = new HashMap<>();
        client.schema().getIndexLabels().forEach(il -> {
            oldIndexLabels.put(il.name(), il);
        });

        ConflictDetail detail = new ConflictDetail();
        for (IndexLabel newIndexLabel : indexLabels) {
            String name = newIndexLabel.name();
            IndexLabel oldIndexLabel = oldIndexLabels.get(name);
            if (oldIndexLabel == null) {
                detail.put(SchemaType.PROPERTY_INDEX, name,
                           ConflictStatus.PASSED);
            } else if (isEqual(newIndexLabel, oldIndexLabel)) {
                detail.put(SchemaType.PROPERTY_INDEX, name,
                           ConflictStatus.EXISTED);
            } else {
                detail.put(SchemaType.PROPERTY_INDEX, name,
                           ConflictStatus.DUPNAME);
            }
        }
        return detail;
    }

    public static PropertyIndex convert(IndexLabel indexLabel) {
        return PropertyIndex.builder()
                            .owner(indexLabel.baseValue())
                            .name(indexLabel.name())
                            .type(indexLabel.indexType())
                            .fields(indexLabel.indexFields())
                            .build();
    }

    private static boolean isEqual(IndexLabel oldSchema, IndexLabel newSchema) {
        return oldSchema.name().equals(newSchema.name()) &&
               oldSchema.baseType().equals(newSchema.baseType()) &&
               oldSchema.baseValue().equals(newSchema.baseValue()) &&
               oldSchema.indexType().equals(newSchema.indexType()) &&
               oldSchema.indexFields().equals(newSchema.indexFields());
    }
}
