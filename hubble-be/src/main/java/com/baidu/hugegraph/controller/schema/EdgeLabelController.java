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
import java.util.List;
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
import com.baidu.hugegraph.entity.schema.ConflictStatus;
import com.baidu.hugegraph.entity.schema.EdgeLabelEntity;
import com.baidu.hugegraph.entity.schema.LabelUpdateEntity;
import com.baidu.hugegraph.service.schema.EdgeLabelService;
import com.baidu.hugegraph.service.schema.PropertyKeyService;
import com.baidu.hugegraph.service.schema.VertexLabelService;
import com.baidu.hugegraph.util.CollectionUtil;
import com.baidu.hugegraph.util.Ex;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.google.common.collect.ImmutableList;

@RestController
@RequestMapping("schema/edgelabels")
public class EdgeLabelController extends SchemaController {

    private static final List<String> PRESET_COLORS = ImmutableList.of(
            //            "#fa2f4c", "#ff7438", "#ffc900", "#00c22a", "#00bbff",
            //            "#0079ff", "#5957e0", "#bb4be5", "#ff1c5f"
            "#ED5736", "#4C8DAE", "#48C0A3", "#FF8C31", "#3B2E7E", "#6E511E",
            "#F47983", "#60281E", "#B36D61", "#C89B40", "#8D4BBB", "#789262",
            "#177CB0", "#8C4356"
    );

    @Autowired
    private PropertyKeyService pkService;
    @Autowired
    private VertexLabelService vlService;
    @Autowired
    private EdgeLabelService elService;

    @GetMapping
    public IPage<EdgeLabelEntity> list(@RequestParam("conn_id") int connId,
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
        return this.listInPage(id -> this.elService.list(id),
                               connId, nameOrder, pageNo, pageSize);
    }

    @GetMapping("{name}")
    public EdgeLabelEntity get(@PathVariable("name") String name,
                               @RequestParam("conn_id") int connId) {
        EdgeLabelEntity entity = this.elService.get(name, connId);
        Ex.check(entity != null, "schema.edgelabel.not-exist", name);
        return entity;
    }

    @PostMapping
    public void create(@RequestBody EdgeLabelEntity entity,
                       @RequestParam("conn_id") int connId) {
        this.checkParamsValid(entity, connId, true);
        this.checkEntityUnique(entity, connId, true);
        entity.setCreateTime(new Date());
        this.elService.add(entity, connId);
    }

    @PostMapping("check_conflicts")
    public ConflictDetail checkConflict(@RequestBody List<String> names,
                                        @RequestParam("reused_conn_id")
                                        int reusedConnId,
                                        @RequestParam("conn_id") int connId) {
        Ex.check(connId != reusedConnId, "schema.conn.cannot-reuse-self");
        Ex.check(!CollectionUtils.isEmpty(names),
                 "common.param.cannot-be-empty", "names");
        return this.elService.checkConflicts(names, reusedConnId, connId);
    }

    @PostMapping("check_conflict")
    public ConflictStatus checkConflict(@RequestBody EdgeLabelEntity entity,
                                        @RequestParam("conn_id") int connId) {
//        this.checkParamsValid(entity, connId, false);
        return this.elService.checkConflict(entity, connId);
    }

    @PostMapping("reuse")
    public void reuse(@RequestBody ConflictDetail detail,
                      @RequestParam("conn_id") int connId) {
//        Ex.check(!CollectionUtils.isEmpty(names),
//                 "common.param.cannot-be-empty", "names");
        this.elService.reuse(detail, connId);
    }

    @PutMapping("{name}")
    public void update(@PathVariable("name") String name,
                       @RequestParam("conn_id") int connId,
                       @RequestBody LabelUpdateEntity entity) {
        Ex.check(!StringUtils.isEmpty(name),
                 "common.param.cannot-be-null-and-empty", name);
        entity.setName(name);

        EdgeLabelEntity oldEntity = this.elService.get(name, connId);
        Ex.check(oldEntity != null, "schema.edgelabel.not-exist", name);
        checkParamsValid(this.pkService, entity, connId);
        this.elService.update(entity, connId);
    }

    /**
     * Delete edge label doesn't need check checkUsing
     */
    @DeleteMapping
    public void delete(@RequestParam("names") List<String> names,
                       @RequestParam("conn_id") int connId) {
        for (String name : names) {
            EdgeLabelEntity entity = this.elService.get(name, connId);
            Ex.check(entity != null, "schema.edgelabel.not-exist", name);
            this.elService.remove(name, connId);
        }
    }

    private void checkParamsValid(EdgeLabelEntity entity, int connId,
                                  boolean checkCreateTime) {
        String name = entity.getName();
        Ex.check(name != null, "common.param.cannot-be-null", "name");
        Ex.check(NAME_PATTERN.matcher(name).matches(),
                 "schema.edgelabel.unmatch-regex", name);
        Ex.check(checkCreateTime, () -> entity.getCreateTime() == null,
                 "common.param.must-be-null", "create_time");
        // Check source label and target label
        checkRelation(entity, connId);
        // Check properties
        checkProperties(this.pkService, entity.getProperties(), false, connId);
        // Check sort keys
        checkSortKeys(entity);
        // Check property index
        checkPropertyIndexes(entity, connId);
    }

    private void checkRelation(EdgeLabelEntity entity, int connId) {
        String sourceLabel = entity.getSourceLabel();
        String targetLabel = entity.getTargetLabel();
        Ex.check(!StringUtils.isEmpty(sourceLabel),
                 "common.param.cannot-be-null-and-empty",
                 "edgelabel.source_label");
        Ex.check(!StringUtils.isEmpty(targetLabel),
                 "common.param.cannot-be-null-and-empty",
                 "edgelabel.target_label");

        Ex.check(this.vlService.exist(sourceLabel, connId),
                 "schema.vertexlabel.not-exist", sourceLabel);
        Ex.check(this.vlService.exist(targetLabel, connId),
                 "schema.vertexlabel.not-exist", targetLabel);
    }

    private void checkSortKeys(EdgeLabelEntity entity) {
        List<String> sortKeys = entity.getSortKeys();
        if (entity.isLinkMultiTimes()) {
            Ex.check(!CollectionUtils.isEmpty(entity.getProperties()),
                     "schema.edgelabel.property.cannot-be-null-and-empty",
                     entity.getName());
            Ex.check(!CollectionUtils.isEmpty(sortKeys),
                     "schema.edgelabel.sortkey.cannot-be-null-and-empty",
                     entity.getName());
            // All sort keys must belong to properties
            Set<String> propNames = entity.getPropNames();
            Ex.check(propNames.containsAll(sortKeys),
                     "schema.edgelabel.sortkey.must-belong-to.property",
                     entity.getName(), sortKeys, propNames);
            // Any sort key can't be nullable
            Ex.check(!CollectionUtil.hasIntersection(sortKeys,
                                                     entity.getNullableProps()),
                     "schmea.edgelabel.sortkey.cannot-be-nullable",
                     entity.getName());
        } else {
            Ex.check(CollectionUtils.isEmpty(sortKeys),
                     "schema.edgelabel.sortkey.should-be-null-or-empty",
                     entity.getName());
        }
    }

    private void checkEntityUnique(EdgeLabelEntity newEntity, int connId,
                                   boolean creating) {
        // The name must be unique
        String name = newEntity.getName();
        EdgeLabelEntity oldEntity = this.elService.get(name, connId);
        Ex.check(oldEntity == null, "schema.edgelabel.exist", name);
    }
}
