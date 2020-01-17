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
//package com.baidu.hugegraph.entity.license;
//
//import java.util.ArrayList;
//import java.util.List;
//
//import org.apache.commons.lang3.StringUtils;
//
//import lombok.AllArgsConstructor;
//import lombok.Builder;
//import lombok.Data;
//
//@Data
//@AllArgsConstructor
//@Builder
//public class VerifyResult {
//
//    private boolean enabled;
//    private String graphsMessage;
//    private List<String> dataSizeMessages;
//
//    public VerifyResult() {
//        this.enabled = true;
//        this.graphsMessage = null;
//        this.dataSizeMessages = new ArrayList<>();
//    }
//
//    public void add(String disableReason) {
//        this.dataSizeMessages.add(disableReason);
//    }
//
//    public String getMessage() {
//        StringBuilder sb = new StringBuilder();
//        if (!StringUtils.isEmpty(this.graphsMessage)) {
//            sb.append(this.graphsMessage);
//            if (!this.dataSizeMessages.isEmpty()) {
//                sb.append(";");
//                for (String dataSizeMsg : this.dataSizeMessages) {
//                    sb.append(dataSizeMsg);
//                    sb.append(",");
//                }
//            }
//        }
//    }
//}
