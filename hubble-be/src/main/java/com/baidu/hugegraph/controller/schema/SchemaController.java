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

package com.baidu.hugegraph.controller.schema;

import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Pattern;

import org.springframework.util.StringUtils;

import com.baidu.hugegraph.controller.BaseController;
import com.baidu.hugegraph.entity.schema.LabelUpdateEntity;
import com.baidu.hugegraph.entity.schema.Property;
import com.baidu.hugegraph.entity.schema.PropertyIndex;
import com.baidu.hugegraph.entity.schema.SchemaEntity;
import com.baidu.hugegraph.entity.schema.SchemaLabelEntity;
import com.baidu.hugegraph.entity.schema.Timefiable;
import com.baidu.hugegraph.service.schema.PropertyKeyService;
import com.baidu.hugegraph.util.Ex;
import com.baidu.hugegraph.util.PageUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;

public class SchemaController extends BaseController {

    protected static final Pattern NAME_PATTERN = Pattern.compile(
            "^[A-Za-z0-9_]{0,128}$"
    );

    public <T extends SchemaEntity> IPage<T> listInPage(
                                             Function<Integer, List<T>> fetcher,
                                             int connId, String nameOrder,
                                             int pageNo, int pageSize) {
        List<T> entities = fetcher.apply(connId);
        if (!StringUtils.isEmpty(nameOrder)) {
            Ex.check(ORDER_ASC.equals(nameOrder) || ORDER_DESC.equals(nameOrder),
                     "common.name-order.invalid", nameOrder);
            // sort by name
            this.sortByName(entities, ORDER_ASC.equals(nameOrder));
        } else {
            // sort by create time(NOTE: some entity create time maybe null)
            this.sortByCreateTime(entities, false);
        }
        return PageUtil.page(entities, pageNo, pageSize);
    }

    public <T extends SchemaEntity> void sortByName(List<T> entities,
                                                    boolean asc) {
        if (asc) {
            entities.sort(Comparator.comparing(SchemaEntity::getName));
        } else {
            entities.sort(Comparator.comparing(SchemaEntity::getName)
                                    .reversed());
        }
    }

    public <T extends SchemaEntity> void sortByCreateTime(List<T> entities,
                                                          boolean asc) {
        Comparator<T> dateAscComparator = (o1, o2) -> {
            assert o1 instanceof Timefiable;
            assert o2 instanceof Timefiable;
            Date t1 = ((Timefiable) o1).getCreateTime();
            Date t2 = ((Timefiable) o2).getCreateTime();
            if (t1 == null && t2 == null) {
                return 0;
            } else if (t1 == null) {
                // t2 != null
                return -1;
            } else if (t2 == null) {
                // t1 != null
                return 1;
            } else {
                return t1.compareTo(t2);
            }
        };

        if (asc) {
            entities.sort(dateAscComparator);
        } else {
            entities.sort(dateAscComparator.reversed());
        }
    }

    /**
     * Check properties are defined
     */
    public static void checkProperties(PropertyKeyService service,
                                       Set<Property> properties,
                                       boolean mustNullable, int connId) {
        if (properties == null) {
            return;
        }
        for (Property property : properties) {
            String pkName = property.getName();
            Ex.check(service.exist(pkName, connId),
                     "schema.propertykey.not-exist", pkName);
            Ex.check(mustNullable, property::isNullable,
                     "schema.propertykey.should-be-nullable");
        }
    }

    public static void checkPropertyIndexes(SchemaLabelEntity entity,
                                            int connId) {
        List<PropertyIndex> propertyIndexes = entity.getPropertyIndexes();
        if (propertyIndexes != null) {
            for (PropertyIndex propertyIndex : propertyIndexes) {
                Ex.check(propertyIndex.getOwner() == null,
                         "common.param.must-be-null", "property_index.owner");
                Ex.check(propertyIndex.getName() != null,
                         "common.param.cannot-be-null", "property_index.name");
                Ex.check(propertyIndex.getSchemaType() != null,
                         "common.param.cannot-be-null", "property_index.type");
                Ex.check(propertyIndex.getFields() != null,
                         "common.param.cannot-be-null", "property_index.fields");
            }
        }
    }

    public static void checkParamsValid(PropertyKeyService service,
                                        LabelUpdateEntity entity, int connId) {
        // All append property should be nullable
        checkProperties(service, entity.getAppendProperties(), true, connId);
    }
}
