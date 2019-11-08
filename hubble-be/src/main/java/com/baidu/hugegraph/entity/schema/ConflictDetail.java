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

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.util.CollectionUtils;

import com.baidu.hugegraph.structure.SchemaElement;
import com.baidu.hugegraph.structure.schema.IndexLabel;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConflictDetail {

    @JsonProperty("type")
    private SchemaType type;

    @JsonProperty("propertykey_conflicts")
    private List<SchemaConflict<PropertyKeyEntity>> propertyKeyConflicts;

    @JsonProperty("propertyindex_conflicts")
    private List<SchemaConflict<PropertyIndex>> propertyIndexConflicts;

    @JsonProperty("vertexlabel_conflicts")
    private List<SchemaConflict<VertexLabelEntity>> vertexLabelConflicts;

    @JsonProperty("edgelabel_conflicts")
    private List<SchemaConflict<EdgeLabelEntity>> edgeLabelConflicts;

    @JsonCreator
    public ConflictDetail(SchemaType type) {
        this.type = type;
        this.propertyKeyConflicts = new ArrayList<>();
        this.propertyIndexConflicts = new ArrayList<>();
        this.vertexLabelConflicts = new ArrayList<>();
        this.edgeLabelConflicts = new ArrayList<>();
    }

    public void add(PropertyKeyEntity entity, ConflictStatus status) {
        this.propertyKeyConflicts.add(new SchemaConflict<>(entity, status));
    }

    public void add(PropertyIndex entity, ConflictStatus status) {
        this.propertyIndexConflicts.add(new SchemaConflict<>(entity, status));
    }

    public void add(VertexLabelEntity entity, ConflictStatus status) {
        this.vertexLabelConflicts.add(new SchemaConflict<>(entity, status));
    }

    public void add(EdgeLabelEntity entity, ConflictStatus status) {
        this.edgeLabelConflicts.add(new SchemaConflict<>(entity, status));
    }

    public void merge(ConflictDetail other) {
        this.propertyKeyConflicts.addAll(other.propertyKeyConflicts);
        this.propertyIndexConflicts.addAll(other.propertyIndexConflicts);
        this.vertexLabelConflicts.addAll(other.vertexLabelConflicts);
        this.edgeLabelConflicts.addAll(other.edgeLabelConflicts);
    }

    public boolean anyPropertyKeyConflict(Set<String> properties) {
        if (CollectionUtils.isEmpty(properties)) {
            return false;
        }
        return this.propertyKeyConflicts.stream().anyMatch(conflict -> {
            String name = conflict.getEntity().getName();
            return conflict.getStatus().isConflicted() &&
                   properties.contains(name);
        });
    }

    public boolean anyPropertyIndexConflict(List<IndexLabel> indexLabels) {
        if (CollectionUtils.isEmpty(indexLabels)) {
            return false;
        }
        Set<String> names = indexLabels.stream().map(SchemaElement::name)
                                       .collect(Collectors.toSet());
        return this.propertyIndexConflicts.stream().anyMatch(conflict -> {
            String name = conflict.getEntity().getName();
            return conflict.getStatus().isConflicted() && names.contains(name);
        });
    }

    public boolean anyVertexLabelConflict(List<String> vertexLabels) {
        if (CollectionUtils.isEmpty(vertexLabels)) {
            return false;
        }
        return this.vertexLabelConflicts.stream().anyMatch(conflict -> {
            String name = conflict.getEntity().getName();
            return conflict.getStatus().isConflicted() &&
                   vertexLabels.contains(name);
        });
    }

    public boolean hasConflict() {
        for (SchemaConflict<?> conflict : this.propertyKeyConflicts) {
            if (conflict.getStatus().isConflicted()) {
                return true;
            }
        }
        for (SchemaConflict<?> conflict : this.propertyIndexConflicts) {
            if (conflict.getStatus().isConflicted()) {
                return true;
            }
        }
        for (SchemaConflict<?> conflict : this.vertexLabelConflicts) {
            if (conflict.getStatus().isConflicted()) {
                return true;
            }
        }
        for (SchemaConflict<?> conflict : this.edgeLabelConflicts) {
            if (conflict.getStatus().isConflicted()) {
                return true;
            }
        }
        return false;
    }
}
