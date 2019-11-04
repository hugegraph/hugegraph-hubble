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
//import static com.baidu.hugegraph.common.Constant.UPLOAD_PERCENT;
//
//import javax.servlet.http.HttpSession;
//
//import org.apache.commons.fileupload.ProgressListener;
//import org.springframework.stereotype.Component;
//
//import lombok.extern.log4j.Log4j2;
//
//@Log4j2
//@Component
//public class UploadProgressListener implements ProgressListener {
//
//    private HttpSession session;
//
//    public void setSession(HttpSession session) {
//        this.session = session;
//        log.info(UPLOAD_PERCENT + ": 0");
//        session.setAttribute(UPLOAD_PERCENT, 0);
//    }
//
//    @Override
//    public void update(long bytesRead, long contentLength, int items) {
//        int percent = (int) (bytesRead * 100.0 / contentLength);
//        if (percent % 10 == 0) {
//            log.info("第 {} 个文件，进度" + UPLOAD_PERCENT + ": {}",
//                     items, percent);
//        }
//        this.session.setAttribute(UPLOAD_PERCENT, percent);
//    }
//}
