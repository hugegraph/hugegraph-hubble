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

import java.io.File;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.config.HugeConfig;
import com.baidu.hugegraph.entity.load.FileUploadResult;
import com.baidu.hugegraph.exception.InternalException;
import com.baidu.hugegraph.options.HubbleOptions;
import com.baidu.hugegraph.service.load.FileMappingService;
import com.baidu.hugegraph.util.Ex;

import lombok.extern.log4j.Log4j2;

@Log4j2
@RestController
@RequestMapping(Constant.API_VERSION + "graph-connections/{connId}/upload-file")
public class FileUploadController {

    @Autowired
    private HugeConfig config;
    @Autowired
    private FileMappingService fmService;

    @PostMapping
    public FileUploadResult upload(@PathVariable("connId") int connId,
                                   @RequestParam("file") MultipartFile file,
                                   @RequestParam("total") int total,
                                   @RequestParam("index") int index) {
        String location = this.config.get(HubbleOptions.UPLOAD_FILE_LOCATION);
        this.ensureLocationExist(location, connId);
        // Now allowed to upload empty file
        Ex.check(!file.isEmpty(), "load.upload.file.cannot-be-empty");
        // Difficult: how to determine whether the file is csv or text
        log.info("File content type: {}", file.getContentType());

        String fileName = file.getOriginalFilename();
        String dirPath = Paths.get(location, String.valueOf(connId), fileName)
                              .toString();
        // File all parts saved path
        File dir = new File(dirPath);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        // Current part saved path
        File curPartFile = new File(dirPath, fileName + "-" + index);
        if (curPartFile.exists()) {
            curPartFile.delete();
        }
        // Check destFile exist
//        Ex.check(!destFile.exists(), "load.upload.file.existed", fileName);
        FileUploadResult result = this.fmService.uploadFile(connId, file,
                                                            curPartFile);
        // Determine whether all the parts have been uploaded, and then merge them
        this.fmService.tryMergePartFiles(dir, total);
        return result;
    }

    @DeleteMapping
    public Map<String, Boolean> delete(@PathVariable("connId") int connId,
                                       @RequestParam("names")
                                       List<String> names) {
        Ex.check(names.size() > 0, "load.upload.files.at-least-one");
        String location = this.config.get(HubbleOptions.UPLOAD_FILE_LOCATION);
        Map<String, Boolean> result = new LinkedHashMap<>();
        for (String fileName : names) {
            String path = Paths.get(location, String.valueOf(connId), fileName)
                               .toString();
            File destFile = new File(path);
            boolean deleted = destFile.delete();
            result.put(fileName, deleted);
        }
        return result;
    }

    private void ensureLocationExist(String location, int connId) {
        String path = Paths.get(location, String.valueOf(connId)).toString();
        File locationDir = new File(path);
        if (!locationDir.exists()) {
            try {
                FileUtils.forceMkdir(locationDir);
            } catch (IOException e) {
                throw new InternalException("failed to create location dir", e);
            }
        }
    }
}
