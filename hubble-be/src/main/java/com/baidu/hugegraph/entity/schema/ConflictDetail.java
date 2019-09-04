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

package com.baidu.hugegraph.entity.schema;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.util.CollectionUtils;

import com.baidu.hugegraph.structure.schema.IndexLabel;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class ConflictDetail {

    @JsonProperty("propertykeys")
    private Map<String, ConflictStatus> propertyKeyStatuses;

    @JsonProperty("vertexlabels")
    private Map<String, ConflictStatus> vertexLabelStatuses;

    @JsonProperty("edgelabels")
    private Map<String, ConflictStatus> edgeLabelStatuses;

    @JsonProperty("propertyindexes")
    private Map<String, ConflictStatus> propertyIndexStatuses;

    public ConflictDetail() {
        this.propertyKeyStatuses = new HashMap<>();
        this.vertexLabelStatuses = new HashMap<>();
        this.edgeLabelStatuses = new HashMap<>();
        this.propertyIndexStatuses = new HashMap<>();
    }

    public void put(SchemaType type, String name, ConflictStatus status) {
        switch (type) {
            case PROPERTY_KEY:
                this.propertyKeyStatuses.put(name, status);
                break;
            case VERTEX_LABEL:
                this.vertexLabelStatuses.put(name, status);
                break;
            case EDGE_LABEL:
                this.edgeLabelStatuses.put(name, status);
                break;
            case PROPERTY_INDEX:
                this.propertyIndexStatuses.put(name, status);
                break;
            default:
                throw new AssertionError(String.format(
                          "Unknown schema type '%s'", type));
        }
    }

    public void merge(ConflictDetail other) {
        this.propertyKeyStatuses.putAll(other.propertyKeyStatuses);
        this.vertexLabelStatuses.putAll(other.vertexLabelStatuses);
        this.edgeLabelStatuses.putAll(other.edgeLabelStatuses);
        this.propertyIndexStatuses.putAll(other.propertyIndexStatuses);
    }

    public List<String> filter(SchemaType type) {
        Map<String, ConflictStatus> statuses;
        switch (type) {
            case PROPERTY_KEY:
                statuses = this.propertyKeyStatuses;
                break;
            case VERTEX_LABEL:
                statuses = this.vertexLabelStatuses;
                break;
            case EDGE_LABEL:
                statuses = this.edgeLabelStatuses;
                break;
            case PROPERTY_INDEX:
                statuses = this.propertyIndexStatuses;
                break;
            default:
                throw new AssertionError(String.format(
                          "Unknown schema type '%s'", type));
        }

        return statuses.entrySet().stream().filter(e -> {
            return e.getValue() == ConflictStatus.PASSED;
        }).map(Map.Entry::getKey).collect(Collectors.toList());
    }

    public boolean anyPropertyKeyConflict(Set<String> properties) {
        if (CollectionUtils.isEmpty(properties)) {
            return false;
        }
        return properties.stream().anyMatch(name -> {
            ConflictStatus status = this.propertyKeyStatuses.get(name);
            return status != null && status.isConflicted();
        });
    }

    public boolean anyPropertyIndexConflict(List<IndexLabel> indexLabels) {
        if (CollectionUtils.isEmpty(indexLabels)) {
            return false;
        }
        return indexLabels.stream().anyMatch(il -> {
            ConflictStatus status = this.propertyIndexStatuses.get(il.name());
            return status != null && status.isConflicted();
        });
    }

    public boolean anyVertexLabelConflict(List<String> vertexLabels) {
        if (CollectionUtils.isEmpty(vertexLabels)) {
            return false;
        }
        return vertexLabels.stream().anyMatch(name -> {
            ConflictStatus status = this.vertexLabelStatuses.get(name);
            return status != null && status.isConflicted();
        });
    }

    public boolean hasConflict() {
        for (ConflictStatus status : this.propertyKeyStatuses.values()) {
            if (status.isConflicted()) {
                return true;
            }
        }
        for (ConflictStatus status : this.vertexLabelStatuses.values()) {
            if (status.isConflicted()) {
                return true;
            }
        }
        for (ConflictStatus status : this.edgeLabelStatuses.values()) {
            if (status.isConflicted()) {
                return true;
            }
        }
        for (ConflictStatus status : this.propertyIndexStatuses.values()) {
            if (status.isConflicted()) {
                return true;
            }
        }
        return false;
    }
}
