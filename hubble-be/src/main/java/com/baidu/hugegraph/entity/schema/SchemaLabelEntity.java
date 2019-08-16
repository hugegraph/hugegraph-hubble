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

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonIgnore;

public interface SchemaLabelEntity {

    public String getName();

    public Set<AttachedProperty> getProperties();

    public List<PropertyIndex> getPropertyIndexes();

    @JsonIgnore
    public boolean isVertexLabel();

    @JsonIgnore
    public default Set<String> getPropNames() {
        if (this.getProperties() == null) {
            return Collections.emptySet();
        }
        return this.getProperties().stream()
                   .map(AttachedProperty::getName)
                   .collect(Collectors.toSet());
    }

    @JsonIgnore
    public default Set<String> getNullableProps() {
        if (this.getProperties() == null) {
            return Collections.emptySet();
        }
        return this.getProperties().stream()
                   .filter(AttachedProperty::isNullable)
                   .map(AttachedProperty::getName)
                   .collect(Collectors.toSet());
    }
}
