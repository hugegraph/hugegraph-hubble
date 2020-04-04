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
//package com.baidu.hugegraph.handler;
//
//import org.aspectj.lang.ProceedingJoinPoint;
//import org.aspectj.lang.annotation.Around;
//import org.aspectj.lang.annotation.Aspect;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Component;
//
//import com.baidu.hugegraph.entity.enums.LoadStatus;
//import com.baidu.hugegraph.entity.load.LoadTask;
//import com.baidu.hugegraph.exception.InternalException;
//import com.baidu.hugegraph.loader.executor.LoadContext;
//import com.baidu.hugegraph.service.load.LoadTaskService;
//
//import lombok.extern.log4j.Log4j2;
//
//@Log4j2
//@Component
//@Aspect
//public class LoadTaskMonitor {
//
//    @Autowired
//    private LoadTaskService service;
//
//    @Around("execution(* com.baidu.hugegraph.handler.LoadTaskExecutor.execute(..))")
//    public void taskHandle(ProceedingJoinPoint pjp) {
//        LoadTask task = (LoadTask) pjp.getArgs()[0];
//        LoadContext context = task.context();
//        log.info("LoadTaskMonitor is monitoring task : {}", task.getId());
//
//        boolean succeed;
//        try {
//            succeed = (boolean) pjp.proceed();
//        } catch (Throwable e) {
//            succeed = false;
//            log.error("Run task {} failed. cause: {}",
//                      task.getId(), e.getMessage());
//        }
//        // Pay attention to whether the user stops actively or
//        // the program stops by itself
//        if (task.getStatus().inRunning()) {
//            if (succeed) {
//                task.setStatus(LoadStatus.SUCCEED);
//            } else {
//                task.setStatus(LoadStatus.FAILED);
//            }
//        }
//        task.setFileReadLines(context.newProgress().totalInputReaded());
//        task.setDuration(context.summary().totalTime());
//        if (this.service.update(task) != 1) {
//            throw new InternalException("entity.update.failed", task);
//        }
//        this.service.getTaskContainer().remove(task.getId());
//    }
//}
