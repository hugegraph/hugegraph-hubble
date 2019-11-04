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
//package com.baidu.hugegraph.service.load;
//
//import java.util.concurrent.locks.Condition;
//import java.util.concurrent.locks.Lock;
//import java.util.concurrent.locks.LockSupport;
//
//import com.baidu.hugegraph.exception.ExternalException;
//import com.baidu.hugegraph.loader.executor.LoadExecutor;
//import com.baidu.hugegraph.loader.executor.LoadOptions;
//import com.baidu.hugegraph.loader.executor.LoadStatus;
//import com.baidu.hugegraph.loader.struct.GraphStruct;
//import com.baidu.hugegraph.util.E;
//
//public final class LoadScheduler extends Thread {
//
//    private LoadExecutor loader;
//    private LoadStatus status;
//
//    private final Lock lock;
//    private final Condition loading;
//
//    public LoadScheduler(LoadOptions options, GraphStruct struct, Lock lock) {
//        this.loader = new LoadExecutor(options, struct);
//        this.status = LoadStatus.READY;
//        this.lock = lock;
//        this.loading = this.lock.newCondition();
//    }
//
//    public LoadStatus status() {
//        return this.status;
//    }
//
//    @Override
//    public void run() {
//        super.run();
//    }
//
//    public void startLoad() {
//        boolean fetched = this.lock.tryLock();
//        if (!fetched) {
//            throw new ExternalException("当前有另一个用户在进行该文件的导入操作");
//        }
//        try {
//            E.checkState(this.status == LoadStatus.READY ||
//                         this.status == LoadStatus.FINISHED,
//                         "Only the ready or finished task can perform start, " +
//                         "current status is %s", this.status);
//            this.status = LoadStatus.RUNNING;
//        } finally {
//            this.lock.unlock();
//        }
//        this.loader.load();
//    }
//
//    public void pauseLoad() {
//        boolean fetched = this.lock.tryLock();
//        if (!fetched) {
//            throw new ExternalException("当前有另一个用户在进行该文件的导入操作");
//        }
//        try {
//            E.checkState(this.status == LoadStatus.RUNNING,
//                         "Only the running task can perform pause, " +
//                         "current status is %s", this.status);
//            this.status = LoadStatus.PAUSED;
//            // 这里的阻塞条件是什么？
////            while () {
////                this.loading.awaitUninterruptibly();
////                this.loader.pause();
////            }
//            LockSupport.park();
////            LockSupport.unpark();
//        } finally {
//            this.lock.unlock();
//        }
//    }
//
//    public void resumeLoad() {
//        E.checkState(this.status == LoadStatus.PAUSED,
//                     "Only the pause task can perform resume, " +
//                     "current status is %s", this.status);
//        this.status = LoadStatus.RUNNING;
//        this.loader.load();
//    }
//
//    public void stopLoad() {
//        E.checkState(this.status == LoadStatus.RUNNING ||
//                     this.status == LoadStatus.PAUSED,
//                     "Only the running or pause task can perform stop, " +
//                     "current status is %s", this.status);
//        this.status = LoadStatus.FINISHED;
//        // Need to stop thread pool
//        this.loader.stop();
//        this.loader.shutdown();
//    }
//}
