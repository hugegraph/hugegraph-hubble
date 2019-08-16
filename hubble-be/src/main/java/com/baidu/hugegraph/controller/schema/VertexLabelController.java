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
import java.util.Set;

import org.apache.commons.collections.CollectionUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.baidu.hugegraph.entity.schema.AttachedProperty;
import com.baidu.hugegraph.entity.schema.VertexLabelEntity;
import com.baidu.hugegraph.structure.constant.IdStrategy;
import com.baidu.hugegraph.util.CollectionUtil;
import com.baidu.hugegraph.util.Ex;
import com.baidu.hugegraph.util.PageUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;

@RestController
@RequestMapping("schema/vertexlabels")
public class VertexLabelController extends SchemaController {

    @GetMapping
    public IPage<VertexLabelEntity> list(@RequestParam("connection_id")
                                         int connId,
                                         @RequestParam(name = "page_no",
                                                       required = false,
                                                       defaultValue = "1")
                                         int pageNo,
                                         @RequestParam(name = "page_size",
                                                       required = false,
                                                       defaultValue = "10")
                                         int pageSize) {
        List<VertexLabelEntity> entities = this.service.listVertexLabels(connId);
        return PageUtil.page(entities, pageNo, pageSize);
    }

    @GetMapping("{name}")
    public VertexLabelEntity get(@PathVariable("name") String name,
                                 @RequestParam("connection_id") int connId) {
        VertexLabelEntity oldEntity = this.service.getVertexLabel(name, connId);
        Ex.check(oldEntity != null, "schema.vertexlabel.not-exist.name", name);
        return oldEntity;
    }

    @PostMapping
    public void create(@RequestBody VertexLabelEntity newEntity,
                       @RequestParam("connection_id") int connId) {
        this.checkParamsValid(newEntity, connId, true);
        this.checkEntityUnique(newEntity, connId, true);
        this.service.addVertexLabel(newEntity, connId);
    }

    @PutMapping("{name}")
    public void update(@PathVariable("name") String name,
                       @RequestParam("connection_id") int connId,
                       @RequestBody VertexLabelEntity newEntity) {
        this.checkParamsValid(newEntity, connId, false);
        this.checkEntityUnique(newEntity, connId, false);
        this.service.updateVertexLabel(newEntity, connId);
    }

    @DeleteMapping("{name}")
    public void delete(@PathVariable("name") String name,
                                    @RequestParam("connection_id") int connId) {
        VertexLabelEntity oldEntity = this.service.getVertexLabel(name, connId);
        Ex.check(oldEntity != null, "schema.vertexlabel.not-exist.name", name);
        this.service.removeVertexLabel(name, connId);
    }

    private void checkParamsValid(VertexLabelEntity entity, int connId,
                                  boolean creating) {
        String name = entity.getName();
        Ex.check(name != null, "common.param.cannot-be-null", "name");
        Ex.check(NAME_PATTERN.matcher(name).matches(),
                 "schema.vertexlabel.unmatch-regex", name);

        // Check properties are defined
        Set<AttachedProperty> properties = entity.getProperties();
        if (properties != null) {
            for (AttachedProperty property : properties) {
                String pkName = property.getName();
                Ex.check(this.service.existPropertyKey(pkName, connId),
                         "schema.propertykey.not-exist", pkName);
            }
        }

        IdStrategy idStrategy = entity.getIdStrategy();
        Ex.check(idStrategy != null,
                 "common.param.cannot-be-null", "id_strategy");
        List<String> primaryKeys = entity.getPrimaryKeys();
        if (idStrategy.isPrimaryKey()) {
            Ex.check(CollectionUtils.isNotEmpty(properties),
                     "schema.vertexlabel.property.cannot-be-null-and-empty");
            Ex.check(CollectionUtils.isNotEmpty(primaryKeys),
                     "schema.vertexlabel.primarykey.cannot-be-null-and-empty",
                     idStrategy);
            // All primary keys must belong to properties
            Ex.check(entity.getPropNames().containsAll(primaryKeys),
                     "schema.vertexlabel.primarykey.must-belong-to.property");
            // Any primary key can't be nullable
            Ex.check(!CollectionUtil.hasIntersection(primaryKeys,
                                                     entity.getNullableProps()),
                     "schmea.vertexlabel.primarykey.cannot-be-nullable");
        } else {
            Ex.check(CollectionUtils.isEmpty(primaryKeys),
                     "schema.vertexlabel.primarykey.should-be-null-or-empty",
                     idStrategy);
        }
        // TODO: Check property index, it's a bit complicated
    }

    private void checkEntityUnique(VertexLabelEntity newEntity, int connId,
                                   boolean creating) {
        // The name must be unique
        String name = newEntity.getName();
        VertexLabelEntity oldEntity = this.service.getVertexLabel(name, connId);
        Ex.check(oldEntity == null, "schema.vertexlabel.exist.name", name);
    }
}
