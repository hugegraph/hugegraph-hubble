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

import java.util.List;

import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.baidu.hugegraph.entity.schema.PropertyKeyEntity;
import com.baidu.hugegraph.util.Ex;
import com.baidu.hugegraph.util.PageUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;

@RestController
@RequestMapping("schema/propertykeys")
public class PropertyKeyController extends SchemaController {

    @GetMapping
    public IPage<PropertyKeyEntity> list(@RequestParam("connection_id")
                                         int connId,
                                         @RequestParam(name = "page_no",
                                                       required = false,
                                                       defaultValue = "1")
                                         int pageNo,
                                         @RequestParam(name = "page_size",
                                                       required = false,
                                                       defaultValue = "10")
                                         int pageSize) {
        List<PropertyKeyEntity> entities = this.service.listPropertyKeys(connId);
        return PageUtil.page(entities, pageNo, pageSize);
    }

    @GetMapping("{name}")
    public PropertyKeyEntity get(@PathVariable("name") String name,
                                 @RequestParam("connection_id") int connId) {
        PropertyKeyEntity oldEntity = this.service.getPropertyKey(name, connId);
        Ex.check(oldEntity != null, "schema.propertykey.not-exist", name);
        return oldEntity;
    }

    @PostMapping
    public void create(@RequestBody PropertyKeyEntity newEntity,
                       @RequestParam("connection_id") int connId) {
        this.checkParamsValid(newEntity);
        this.checkEntityUnique(newEntity, connId);
        this.service.addPropertyKey(newEntity, connId);
    }

    @DeleteMapping("{name}")
    public void delete(@PathVariable("name") String name,
                       @RequestParam("connection_id") int connId) {
        PropertyKeyEntity oldEntity = this.service.getPropertyKey(name, connId);
        Ex.check(oldEntity != null, "schema.propertykey.not-exist", name);
        MultiValueMap<String, String> usingSchemaLabels =
                this.service.usingPropertyKey(name, connId);
        Ex.check(usingSchemaLabels.isEmpty(),
                 "schema.propertykey.in-using", name, usingSchemaLabels);
        this.service.removePropertyKey(name, connId);
    }

    private void checkParamsValid(PropertyKeyEntity entity) {
        String name = entity.getName();
        Ex.check(name != null, "common.param.cannot-be-null", "name");
        Ex.check(NAME_PATTERN.matcher(name).matches(),
                 "schema.propertykey.unmatch-regex", name);
        Ex.check(entity.getDataType() != null,
                 "common.param.cannot-be-null", "data_type");
        Ex.check(entity.getCardinality() != null,
                 "common.param.cannot-be-null", "cardinality");
    }

    private void checkEntityUnique(PropertyKeyEntity newEntity, int connId) {
        // The name must be unique
        String name = newEntity.getName();
        PropertyKeyEntity oldEntity = this.service.getPropertyKey(name, connId);
        Ex.check(oldEntity == null, "schema.propertykey.exist", name);
    }
}
