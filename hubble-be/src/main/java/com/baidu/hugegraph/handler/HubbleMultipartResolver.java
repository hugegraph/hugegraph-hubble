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
//import static com.baidu.hugegraph.options.HubbleOptions.UPLOAD_SINGLE_FILE_SIZE_LIMIT;
//import static com.baidu.hugegraph.options.HubbleOptions.UPLOAD_TOTAL_FILE_SIZE_LIMIT;
//
//import java.util.List;
//
//import javax.servlet.http.HttpServletRequest;
//
//import org.apache.commons.fileupload.FileItem;
//import org.apache.commons.fileupload.FileUpload;
//import org.apache.commons.fileupload.FileUploadBase;
//import org.apache.commons.fileupload.FileUploadException;
//import org.apache.commons.fileupload.servlet.ServletFileUpload;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Component;
//import org.springframework.web.multipart.MultipartException;
//import org.springframework.web.multipart.commons.CommonsMultipartResolver;
//
//import com.baidu.hugegraph.config.HugeConfig;
//import com.baidu.hugegraph.exception.ExternalException;
//import com.baidu.hugegraph.util.Bytes;
//
//import lombok.extern.log4j.Log4j2;
//
//@Log4j2
//@Component
//public class HubbleMultipartResolver extends CommonsMultipartResolver {
//
//    @Autowired
//    private HugeConfig config;
//    @Autowired
//    private UploadProgressListener listener;
//
//    @Override
//    protected MultipartParsingResult parseRequest(HttpServletRequest request)
//                                                  throws MultipartException {
//        String encoding = this.determineEncoding(request);
//        FileUpload fileUpload = this.prepareFileUpload(encoding);
//        fileUpload.setProgressListener(this.listener);
//        // Set single and total file limits
//        fileUpload.setFileSizeMax(
//                   this.config.get(UPLOAD_SINGLE_FILE_SIZE_LIMIT) * Bytes.MB);
//        fileUpload.setSizeMax(
//                   this.config.get(UPLOAD_TOTAL_FILE_SIZE_LIMIT) * Bytes.MB);
//
//        this.listener.setSession(request.getSession());
//        List<FileItem> fileItems;
//        try {
//            fileItems = ((ServletFileUpload) fileUpload).parseRequest(request);
//            return this.parseFileItems(fileItems, encoding);
//        } catch (FileUploadBase.FileSizeLimitExceededException e) {
//            throw new ExternalException("load.upload.file.exceed-single-size",
//                                        e, fileUpload.getFileSizeMax());
//        } catch (FileUploadBase.SizeLimitExceededException e) {
//            throw new ExternalException("load.upload.file.exceed-total-size",
//                                        e, fileUpload.getSizeMax());
//        } catch (FileUploadException e) {
//            throw new MultipartException(
//                      "Failed to parse multipart servlet request", e);
//        }
//    }
//}
