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

package com.baidu.hugegraph.controller;

import java.time.LocalDateTime;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.entity.GremlinCollection;
import com.baidu.hugegraph.exception.ExternalException;
import com.baidu.hugegraph.exception.InternalException;
import com.baidu.hugegraph.service.GremlinCollectionService;
import com.baidu.hugegraph.util.Ex;
import com.baomidou.mybatisplus.core.metadata.IPage;

@RestController
@RequestMapping("gremlin-collections")
public class GremlinCollectionController extends BaseController {

    @Autowired
    private GremlinCollectionService service;

    @GetMapping
    public IPage<GremlinCollection> list(@RequestParam(name = "content",
                                                       required = false)
                                         String content,
                                         @RequestParam(name = "nameOrder",
                                                       required = false)
                                         String nameOrder,
                                         @RequestParam(name = "pageNo",
                                                       required = false,
                                                       defaultValue = "1")
                                         long pageNo,
                                         @RequestParam(name = "pageSize",
                                                       required = false,
                                                       defaultValue = "10")
                                         long pageSize) {
        if (!StringUtils.isEmpty(nameOrder)) {
            Ex.check(nameOrder.equals("asc") || nameOrder.equals("desc"),
                     "gremlin-collection.name-order.invalid", nameOrder);
        }
        Boolean nameOrderAsc = null;
        if (!StringUtils.isEmpty(nameOrder)) {
            nameOrderAsc = nameOrder.equals("asc");
        }
        return this.service.list(content, nameOrderAsc, pageNo, pageSize);
    }

    @GetMapping("{id}")
    public GremlinCollection get(@PathVariable("id") int id) {
        return this.service.get(id);
    }

    @PostMapping
    public GremlinCollection create(@RequestBody GremlinCollection newEntity) {
        this.checkParamsValid(newEntity, true);
        this.checkEntityUnique(newEntity, true);
        // Check reached limit
        // TODO: multi thread may lead rows exceed LIMIT
        if (this.service.count() >= Constant.GREMLIN_LIMIT) {
            throw new ExternalException("gremlin-collection.reached-limit",
                                        Constant.GREMLIN_LIMIT);
        }

        newEntity.setCreateTime(LocalDateTime.now());
        int rows = this.service.save(newEntity);
        if (rows != 1) {
            throw new InternalException("entity.insert.failed", newEntity);
        }
        return newEntity;
    }

    @PutMapping("{id}")
    public GremlinCollection update(@PathVariable("id") int id,
                                    @RequestBody GremlinCollection newEntity) {
        this.checkIdWhenUpdate(id, newEntity);
        this.checkParamsValid(newEntity, false);

        GremlinCollection oldEntity = this.service.get(id);
        if (oldEntity == null) {
            throw new ExternalException("gremlin-collection.not-exist.id", id);
        }

        GremlinCollection entity = this.mergeEntity(oldEntity, newEntity);
        this.checkEntityUnique(entity, false);
        int rows = this.service.update(entity);
        if (rows != 1) {
            throw new InternalException("entity.update.failed", entity);
        }
        return entity;
    }

    @DeleteMapping("{id}")
    public GremlinCollection delete(@PathVariable("id") int id) {
        GremlinCollection oldEntity = this.service.get(id);
        if (oldEntity == null) {
            throw new ExternalException("gremlin-collection.not-exist.id", id);
        }
        int rows = this.service.remove(id);
        if (rows != 1) {
            throw new InternalException("entity.delete.failed", oldEntity);
        }
        return oldEntity;
    }

    private void checkParamsValid(GremlinCollection newEntity,
                                  boolean creating) {
        Ex.check(creating, () -> newEntity.getId() == null,
                 "common.param.must-be-null", "id");

        String name = newEntity.getName();
        this.checkParamsNotEmpty("name", name, creating);
        Ex.check(name != null, () -> name.matches(Constant.GREMLIN_NAME_REGEX),
                 "gremlin-collection.name.unmatch-regex", name);

        this.checkParamsNotEmpty("content", newEntity.getContent(), creating);
    }

    private void checkEntityUnique(GremlinCollection newEntity,
                                   boolean creating) {
        String name = newEntity.getName();
        // NOTE: Full table scan may slow, it's better to use index
        GremlinCollection oldEntity = this.service.getByName(name);
        if (creating) {
            Ex.check(oldEntity == null, "gremlin-collection.exist.name", name);
        } else {
            Ex.check(oldEntity != null,
                     "gremlin-collection.not-exist.name", name);
            Ex.check(oldEntity.getId().equals(newEntity.getId()),
                     "gremlin-collection.exist.name", name);
        }
    }
}
