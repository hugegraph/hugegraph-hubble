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

package com.baidu.hugegraph.controller.load;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.controller.BaseController;
import com.baidu.hugegraph.entity.GraphConnection;
import com.baidu.hugegraph.entity.load.FileMapping;
import com.baidu.hugegraph.entity.load.LoadTask;
import com.baidu.hugegraph.exception.ExternalException;
import com.baidu.hugegraph.exception.InternalException;
import com.baidu.hugegraph.service.GraphConnectionService;
import com.baidu.hugegraph.service.load.FileMappingService;
import com.baidu.hugegraph.service.load.LoadTaskService;
import com.baidu.hugegraph.util.Ex;
import com.baomidou.mybatisplus.core.metadata.IPage;

import lombok.extern.log4j.Log4j2;

@Log4j2
@RestController
@RequestMapping(Constant.API_VERSION + "graph-connections/{connId}/load-tasks")
public class LoadTaskController extends BaseController {

    private static final int LIMIT = 500;

    @Autowired
    private GraphConnectionService connService;
    @Autowired
    private FileMappingService fmService;

    private final LoadTaskService service;

    @Autowired
    public LoadTaskController(LoadTaskService service) {
        this.service = service;
    }

    @GetMapping
    public IPage<LoadTask> list(@PathVariable("connId") int connId,
                                @RequestParam(name = "page_no",
                                              required = false,
                                              defaultValue = "1")
                                int pageNo,
                                @RequestParam(name = "page_size",
                                              required = false,
                                              defaultValue = "10")
                                int pageSize) {
        return this.service.list(connId, pageNo, pageSize);
    }

    @GetMapping("{id}")
    public LoadTask get(@PathVariable("id") int id) {
        LoadTask task = this.service.get(id);
        if (task == null) {
            throw new ExternalException("load.task.not-exist.id", id);
        }
        return task;
    }

    @PostMapping
    public LoadTask create(@PathVariable("connId") int connId,
                               @RequestBody LoadTask entity) {
        synchronized(this.service) {
            Ex.check(this.service.count() < LIMIT,
                     "load.task.reached-limit", LIMIT);
            entity.setConnId(connId);
            int rows = this.service.save(entity);
            if (rows != 1) {
                throw new InternalException("entity.insert.failed", entity);
            }
        }
        return entity;
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable("id") int id) {
        LoadTask task = this.service.get(id);
        if (task == null) {
            throw new ExternalException("load.task.not-exist.id", id);
        }
        if (this.service.remove(id) != 1) {
            throw new InternalException("entity.delete.failed", task);
        }
    }

    @PostMapping("start")
    public LoadTask start(@PathVariable("connId") int connId,
                          @RequestParam("file_mapping_id") int fileId) {
        GraphConnection connection = this.connService.get(connId);
        if (connection == null) {
            throw new ExternalException("graph-connection.not-exist.id", connId);
        }
        FileMapping fileMapping = this.fmService.get(fileId);
        if (fileMapping == null) {
            throw new ExternalException("file-mapping.not-exist.id", fileId);
        }
        return this.service.start(connection, fileMapping);
    }

    @PostMapping("pause")
    public LoadTask pause(@PathVariable("connId") int connId,
                          @RequestParam("task_id") int taskId) {
        GraphConnection connection = this.connService.get(connId);
        if (connection == null) {
            throw new ExternalException("graph-connection.not-exist.id", connId);
        }
        return this.service.pause(taskId);
    }

    @PostMapping("resume")
    public LoadTask resume(@PathVariable("connId") int connId,
                           @RequestParam("task_id") int taskId) {
        GraphConnection connection = this.connService.get(connId);
        if (connection == null) {
            throw new ExternalException("graph-connection.not-exist.id", connId);
        }
        return this.service.resume(taskId);
    }

    @PostMapping("stop")
    public LoadTask stop(@PathVariable("connId") int connId,
                         @RequestParam("task_id") int taskId) {
        GraphConnection connection = this.connService.get(connId);
        if (connection == null) {
            throw new ExternalException("graph-connection.not-exist.id", connId);
        }
        return this.service.stop(taskId);
    }

    @PostMapping("retry")
    public LoadTask retry(@PathVariable("connId") int connId,
                          @RequestParam("task_id") int taskId) {
        GraphConnection connection = this.connService.get(connId);
        if (connection == null) {
            throw new ExternalException("graph-connection.not-exist.id", connId);
        }
        return this.service.retry(taskId);
    }
}
