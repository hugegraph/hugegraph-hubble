///*
// * Copyright 2017 HugeGraph Authors
// *
// * Licensed to the Apache Software Foundation (ASF) under one or more
// * contributor license agreements. See the NOTICE file distributed with this
// * work for additional information regarding copyright ownership. The ASF
// * licenses this file to You under the Apache License, Version 2.0 (the
// * "License"); you may not use this file except in compliance with the License.
// * You may obtain a copy of the License at
// *
// *     http://www.apache.org/licenses/LICENSE-2.0
// *
// * Unless required by applicable law or agreed to in writing, software
// * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// * License for the specific language governing permissions and limitations
// * under the License.
// */
//
//package com.baidu.hugegraph.controller.load;
//
//import java.util.Date;
//import java.util.Map;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.web.bind.annotation.DeleteMapping;
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.PathVariable;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestBody;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RequestParam;
//import org.springframework.web.bind.annotation.RestController;
//
//import com.baidu.hugegraph.common.Constant;
//import com.baidu.hugegraph.controller.BaseController;
//import com.baidu.hugegraph.entity.GraphConnection;
//import com.baidu.hugegraph.entity.enums.LoadAction;
//import com.baidu.hugegraph.entity.load.FileMapping;
//import com.baidu.hugegraph.entity.load.LoadTask;
//import com.baidu.hugegraph.exception.ExternalException;
//import com.baidu.hugegraph.exception.InternalException;
//import com.baidu.hugegraph.loader.executor.LoadOptions;
//import com.baidu.hugegraph.loader.struct.GraphStruct;
//import com.baidu.hugegraph.service.GraphConnectionService;
//import com.baidu.hugegraph.service.load.FileMappingService;
//import com.baidu.hugegraph.service.load.LoadScheduler;
//import com.baidu.hugegraph.service.load.LoadTaskService;
//import com.baidu.hugegraph.util.Ex;
//import com.baomidou.mybatisplus.core.metadata.IPage;
//
//import lombok.extern.log4j.Log4j2;
//
//@Log4j2
//@RestController
//@RequestMapping(Constant.API_VERSION + "graph-connections/{connId}/load-tasks")
//public class LoadTaskController extends BaseController {
//
//    private static final int LIMIT = 500;
//
//    @Autowired
//    private GraphConnectionService connService;
//
//    @Autowired
//    private FileMappingService fileMappingService;
//
//    private final LoadTaskService service;
//
//    @Autowired
//    public LoadTaskController(LoadTaskService service) {
//        this.service = service;
//    }
//
//    @GetMapping
//    public IPage<LoadTask> list(@PathVariable("connId") int connId,
//                                @RequestParam(name = "page_no",
//                                              required = false,
//                                              defaultValue = "1")
//                                int pageNo,
//                                @RequestParam(name = "page_size",
//                                              required = false,
//                                              defaultValue = "10")
//                                int pageSize) {
//        // TODO: 还需要添加content，nameorder等参数
//        return this.service.list(connId, pageNo, pageSize);
//    }
//
//    @GetMapping("{id}")
//    public LoadTask get(@PathVariable("id") int id) {
//        LoadTask task = this.service.get(id);
//        if (task == null) {
//            throw new ExternalException("load.task.not-exist.id", id);
//        }
//        return task;
//    }
//
//    @PostMapping
//    public LoadTask create(@PathVariable("connId") int connId,
//                           @RequestBody LoadTask entity) {
//        this.checkParamsValid(entity);
//        synchronized(this.service) {
//            Ex.check(this.service.count() < LIMIT,
//                     "load.task.reached-limit", LIMIT);
//            entity.setConnId(connId);
//            entity.setCreateTime(new Date());
//            int rows = this.service.save(entity);
//            if (rows != 1) {
//                throw new InternalException("entity.insert.failed", entity);
//            }
//        }
//        return entity;
//    }
//
//    @DeleteMapping("{id}")
//    public void delete(@PathVariable("id") int id) {
//        LoadTask task = this.service.get(id);
//        if (task == null) {
//            throw new ExternalException("load.task.not-exist.id", id);
//        }
//
//        int rows = this.service.remove(id);
//        if (rows != 1) {
//            throw new InternalException("entity.delete.failed", task);
//        }
//    }
//
//    @PostMapping("{id}")
//    public void command(@PathVariable("connId") int connId,
//                        @PathVariable("id") int id,
//                        @RequestBody Map<Integer, LoadAction> actions) {
//        GraphConnection connection = this.connService.get(connId);
//        if (connection == null) {
//            throw new ExternalException("graph-connection.not-exist.id", id);
//        }
//
//        LoadTask task = this.service.get(id);
//        if (task == null) {
//            throw new ExternalException("load.task.not-exist.id", id);
//        }
//
//        for (Map.Entry<Integer, LoadAction> entry : actions.entrySet()) {
//            int fileMappingId = entry.getKey();
//            LoadAction action = entry.getValue();
//
//            FileMapping fileMapping = this.fileMappingService.get(fileMappingId);
//            LoadOptions options = this.service.buildLoadOptions(connection,
//                                                                fileMapping);
//            GraphStruct struct = this.service.buildGraphStruct(fileMapping);
//
//            this.service.handleLoadTask(options, struct, action);
//        }
//    }
//
//    private void checkParamsValid(LoadTask entity) {
//        String name = entity.getName();
//        Ex.check(name != null, "common.param.cannot-be-null", "name");
//        Ex.check(Constant.COMMON_NAME_PATTERN.matcher(name).matches(),
//                 "load.task.unmatch-regex", name);
//    }
//}
