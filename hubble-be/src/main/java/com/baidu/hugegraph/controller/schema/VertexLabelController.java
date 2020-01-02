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

import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.baidu.hugegraph.entity.schema.ConflictDetail;
import com.baidu.hugegraph.entity.schema.LabelUpdateEntity;
import com.baidu.hugegraph.entity.schema.MultiSchemaEntity;
import com.baidu.hugegraph.entity.schema.PropertyIndex;
import com.baidu.hugegraph.entity.schema.PropertyKeyEntity;
import com.baidu.hugegraph.entity.schema.SchemaType;
import com.baidu.hugegraph.entity.schema.VertexLabelEntity;
import com.baidu.hugegraph.service.schema.PropertyIndexService;
import com.baidu.hugegraph.service.schema.PropertyKeyService;
import com.baidu.hugegraph.service.schema.VertexLabelService;
import com.baidu.hugegraph.structure.constant.IdStrategy;
import com.baidu.hugegraph.util.CollectionUtil;
import com.baidu.hugegraph.util.Ex;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.google.common.collect.ImmutableList;

@RestController
@RequestMapping("schema/vertexlabels")
public class VertexLabelController extends SchemaController {

    private static final List<String> PRESET_COLORS = ImmutableList.of(
            "#5C73E6", "#569380", "#8ECC93", "#F79767", "#F06667",
            "#C990C0", "#4D8DDA", "#57C7E3", "#FFE081", "#DA7194"
    );

    @Autowired
    private PropertyKeyService pkService;
    @Autowired
    private PropertyIndexService piService;
    @Autowired
    private VertexLabelService vlService;

    @GetMapping("style")
    public Map<String, String> getVertexLabelStyle(@RequestParam("connection_id")
                                                   int connId) {
        List<VertexLabelEntity> entities = this.vlService.list(connId);
        Map<String, String> styles = new HashMap<>();
        for (int i = 0; i < entities.size(); i++) {
            VertexLabelEntity entity = entities.get(i);
            int colorIdx = i % PRESET_COLORS.size();
            String color = PRESET_COLORS.get(colorIdx);
            styles.put(entity.getName(), color);
        }
        return styles;
    }

    @GetMapping("{name}/link")
    public List<String> getLinkEdgeLabels(@PathVariable("name") String name,
                                          @RequestParam("conn_id") int connId) {
        VertexLabelEntity entity = this.vlService.get(name, connId);
        Ex.check(entity != null, "schema.vertexlabel.not-exist", name);
        return this.vlService.linkEdgeLabels(name, connId);
    }

    @GetMapping
    public IPage<VertexLabelEntity> list(@RequestParam("conn_id") int connId,
                                         @RequestParam(name = "content",
                                                       required = false)
                                         String content,
                                         @RequestParam(name = "name_order",
                                                       required = false)
                                         String nameOrder,
                                         @RequestParam(name = "page_no",
                                                       required = false,
                                                       defaultValue = "1")
                                         int pageNo,
                                         @RequestParam(name = "page_size",
                                                       required = false,
                                                       defaultValue = "10")
                                         int pageSize) {
        return this.listInPage(id -> this.vlService.list(id),
                               connId, content, nameOrder, pageNo, pageSize);
    }

    @GetMapping("{name}")
    public VertexLabelEntity get(@PathVariable("name") String name,
                                 @RequestParam("conn_id") int connId) {
        VertexLabelEntity entity = this.vlService.get(name, connId);
        Ex.check(entity != null, "schema.vertexlabel.not-exist", name);
        return entity;
    }

    @PostMapping
    public void create(@RequestBody VertexLabelEntity entity,
                       @RequestParam("conn_id") int connId) {
        this.checkParamsValid(entity, connId, true);
        this.checkEntityUnique(entity, connId, true);
        entity.setCreateTime(new Date());
        this.vlService.add(entity, connId);
    }

    @PostMapping("check_conflict")
    public ConflictDetail checkConflicts(
                          @RequestBody List<VertexLabelEntity> entities,
                          @RequestParam("reused_conn_id") int reusedConnId,
                          @RequestParam("conn_id") int connId) {
        Ex.check(!CollectionUtils.isEmpty(entities),
                 "common.param.cannot-be-empty", "entities");
        Ex.check(connId != reusedConnId, "schema.conn.cannot-reuse-self");

        Set<String> pkNames = new HashSet<>();
        Set<String> piNames = new HashSet<>();
        for (VertexLabelEntity entity : entities) {
            pkNames.addAll(entity.getPropNames());
            piNames.addAll(entity.getIndexProps());
        }
        List<PropertyKeyEntity> pkEntities;
        pkEntities = this.pkService.list(pkNames, reusedConnId, false);
        List<PropertyIndex> piEntities;
        piEntities = this.piService.list(piNames, reusedConnId, false);
        MultiSchemaEntity multiEntity = MultiSchemaEntity.builder()
                                                         .pkEntities(pkEntities)
                                                         .piEntities(piEntities)
                                                         .vlEntities(entities)
                                                         .build();
        return this.vlService.checkConflict(multiEntity, connId, false);
    }

    @PostMapping("recheck_conflict")
    public ConflictDetail recheckConflicts(
                          @RequestBody MultiSchemaEntity multiSchemaEntity,
                          @RequestParam("conn_id") int connId) {
        Ex.check(!CollectionUtils.isEmpty(multiSchemaEntity.getVlEntities()),
                 "common.param.cannot-be-empty", "vertexlabels");
        Ex.check(CollectionUtils.isEmpty(multiSchemaEntity.getElEntities()),
                 "common.param.cannot-be-empty", "edgelabels");
        return this.vlService.checkConflict(multiSchemaEntity, connId, true);
    }

    @PostMapping("reuse")
    public void reuse(@RequestBody ConflictDetail detail,
                      @RequestParam("conn_id") int connId) {
//        Ex.check(!CollectionUtils.isEmpty(names),
//                 "common.param.cannot-be-empty", "names");
        this.vlService.reuse(detail, connId);
    }

    @PutMapping("{name}")
    public void update(@PathVariable("name") String name,
                       @RequestParam("conn_id") int connId,
                       @RequestBody LabelUpdateEntity entity) {
        Ex.check(!StringUtils.isEmpty(name),
                 "common.param.cannot-be-null-or-empty", name);
        entity.setName(name);
        entity.setType(SchemaType.VERTEX_LABEL);

        VertexLabelEntity oldEntity = this.vlService.get(name, connId);
        Ex.check(oldEntity != null, "schema.vertexlabel.not-exist", name);
        checkParamsValid(this.pkService, entity, connId);
        this.vlService.update(entity, connId);
    }

    @PostMapping("check_using")
    public Map<String, Boolean> checkUsing(@RequestBody List<String> names,
                                           @RequestParam("conn_id") int connId) {
        Ex.check(!CollectionUtils.isEmpty(names),
                 "common.param.cannot-be-empty", "names");
        Map<String, Boolean> inUsing = new LinkedHashMap<>();
        for (String name : names) {
            Ex.check(this.vlService.exist(name, connId),
                     "schema.vertexlabel.not-exist", name);
            inUsing.put(name, this.vlService.checkUsing(name, connId));
        }
        return inUsing;
    }

    @DeleteMapping
    public void delete(@RequestParam("names") List<String> names,
                       @RequestParam("conn_id") int connId) {
        for (String name : names) {
            VertexLabelEntity entity = this.vlService.get(name, connId);
            Ex.check(entity != null, "schema.vertexlabel.not-exist", name);
            Ex.check(!this.vlService.checkUsing(name, connId),
                     "schema.vertexlabel.in-using", name);
            this.vlService.remove(name, connId);
        }
    }

    private void checkParamsValid(VertexLabelEntity entity, int connId,
                                  boolean checkCreateTime) {
        String name = entity.getName();
        Ex.check(name != null, "common.param.cannot-be-null", "name");
        Ex.check(NAME_PATTERN.matcher(name).matches(),
                 "schema.vertexlabel.unmatch-regex", name);
        Ex.check(checkCreateTime, () -> entity.getCreateTime() == null,
                 "common.param.must-be-null", "create_time");
        // Check properties
        checkProperties(this.pkService, entity.getProperties(), false, connId);
        // Check primary keys
        checkPrimaryKeys(entity);
        // Check property index
        checkPropertyIndexes(entity, connId);
    }

    private void checkPrimaryKeys(VertexLabelEntity entity) {
        IdStrategy idStrategy = entity.getIdStrategy();
        Ex.check(idStrategy != null,
                 "common.param.cannot-be-null", "id_strategy");
        List<String> primaryKeys = entity.getPrimaryKeys();
        if (idStrategy.isPrimaryKey()) {
            Ex.check(!CollectionUtils.isEmpty(entity.getProperties()),
                     "schema.vertexlabel.property.cannot-be-null-or-empty",
                     entity.getName());
            Ex.check(!CollectionUtils.isEmpty(primaryKeys),
                     "schema.vertexlabel.primarykey.cannot-be-null-or-empty",
                     entity.getName());
            // All primary keys must belong to properties
            Set<String> propNames = entity.getPropNames();
            Ex.check(propNames.containsAll(primaryKeys),
                     "schema.vertexlabel.primarykey.must-belong-to.property",
                     entity.getName(), primaryKeys, propNames);
            // Any primary key can't be nullable
            Ex.check(!CollectionUtil.hasIntersection(primaryKeys,
                                                     entity.getNullableProps()),
                     "schmea.vertexlabel.primarykey.cannot-be-nullable",
                     entity.getName());
        } else {
            Ex.check(CollectionUtils.isEmpty(primaryKeys),
                     "schema.vertexlabel.primarykey.should-be-null-or-empty",
                     entity.getName(), idStrategy);
        }
    }

    private void checkEntityUnique(VertexLabelEntity newEntity, int connId,
                                   boolean creating) {
        // The name must be unique
        String name = newEntity.getName();
        VertexLabelEntity oldEntity = this.vlService.get(name, connId);
        Ex.check(oldEntity == null, "schema.vertexlabel.exist", name);
    }
}
