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

import com.baidu.hugegraph.entity.ExecuteHistory;
import com.baidu.hugegraph.entity.enums.ExecuteStatus;
import com.baidu.hugegraph.exception.ExternalException;
import com.baidu.hugegraph.exception.InternalException;
import com.baidu.hugegraph.service.ExecuteHistoryService;
import com.baidu.hugegraph.util.Ex;
import com.baomidou.mybatisplus.core.metadata.IPage;

@RestController
@RequestMapping("execute-histories")
public class ExecuteHistoryController extends BaseController {

    @Autowired
    private ExecuteHistoryService service;

    @GetMapping
    public IPage<ExecuteHistory> list(@RequestParam(name = "pageNo",
                                                    required = false,
                                                    defaultValue = "1")
                                      long pageNo,
                                      @RequestParam(name = "pageSize",
                                                    required = false,
                                                    defaultValue = "10")
                                      long pageSize) {
        return this.service.list(pageNo, pageSize);
    }

    @GetMapping("{id}")
    public ExecuteHistory get(@PathVariable("id") int id) {
        return this.service.get(id);
    }

    @PostMapping
    public ExecuteHistory create(@RequestBody ExecuteHistory newEntity) {
        this.checkParamsValid(newEntity, true);
        newEntity.setCreateTime(LocalDateTime.now());
        if (newEntity.getStatus() == null) {
            newEntity.setStatus(ExecuteStatus.RUNNING);
        }
        if (newEntity.getDuration() == null) {
            newEntity.setDuration(0);
        }
        int rows = this.service.save(newEntity);
        if (rows != 1) {
            throw new InternalException("entity.insert.failed", newEntity);
        }
        return newEntity;
    }

    @PutMapping("{id}")
    public ExecuteHistory update(@PathVariable("id") int id,
                                 @RequestBody ExecuteHistory newEntity) {
        this.checkIdWhenUpdate(id, newEntity);
        this.checkParamsValid(newEntity, false);

        ExecuteHistory oldEntity = this.service.get(id);
        if (oldEntity == null) {
            throw new ExternalException("execute-history.not-exist.id", id);
        }

        ExecuteHistory entity = this.mergeEntity(oldEntity, newEntity);
        int rows = this.service.update(entity);
        if (rows != 1) {
            throw new InternalException("entity.update.failed", entity);
        }
        return entity;
    }

    @DeleteMapping("{id}")
    public ExecuteHistory delete(@PathVariable("id") int id) {
        ExecuteHistory oldEntity = this.service.get(id);
        if (oldEntity == null) {
            throw new ExternalException("execute-history.not-exist.id", id);
        }
        int rows = this.service.remove(id);
        if (rows != 1) {
            throw new InternalException("entity.delete.failed", oldEntity);
        }
        return oldEntity;
    }

    private void checkParamsValid(ExecuteHistory newEntity, boolean creating) {
        if (creating) {
            Ex.check(newEntity.getId() == null,
                     "common.param.must-be-null", "id");
            Ex.check(newEntity.getType() != null,
                     "common.param.cannot-be-null", "type");
            /*
             * NOTE: the param execute status and duration will be setted to
             * RUNNING and 0 respectively if user doesn't pass when creating
             */
        } else {
            Ex.check(newEntity.getType() == null,
                     "common.param.must-be-null", "type");
            Ex.check(newEntity.getDuration() != null,
                     "common.param.cannot-be-null", "duration");
        }
        this.checkParamsNotEmpty("content", newEntity.getContent(), creating);
    }
}
