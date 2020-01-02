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

package com.baidu.hugegraph.util;

import java.lang.reflect.Field;

import com.baidu.hugegraph.annotation.MergeProperty;
import com.baidu.hugegraph.common.Mergeable;
import com.baidu.hugegraph.exception.InternalException;

public final class EntityUtil {

    @SuppressWarnings("unchecked")
    public static <T extends Mergeable> T merge(T oldEntity, T newEntity) {
        Class<?> clazz = oldEntity.getClass();
        T entity;
        try {
            entity = (T) clazz.newInstance();
        } catch (InstantiationException | IllegalAccessException e) {
            throw new InternalException("reflect.new-instance.failed", e,
                                        clazz.getName());
        }
        Field[] fields = clazz.getDeclaredFields();
        for (Field field : fields) {
            // NOTE: Skip jacoco injected field
            if (field.getName().startsWith("$")) {
                continue;
            }
            field.setAccessible(true);
            MergeProperty property = field.getAnnotation(MergeProperty.class);
            try {
                Object oldFieldValue = field.get(oldEntity);
                Object newFieldValue = field.get(newEntity);
                if (property.useNew()) {
                    if (property.ignoreNull() && newFieldValue == null) {
                        field.set(entity, oldFieldValue);
                    } else {
                        field.set(entity, newFieldValue);
                    }
                } else {
                    field.set(entity, oldFieldValue);
                }
            } catch (IllegalAccessException e) {
                throw new InternalException("reflect.access-field.failed", e,
                                            field.getName(), clazz.getName());
            }
        }
        return entity;
    }
}
