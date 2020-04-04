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

import static com.baidu.hugegraph.service.load.FileMappingService.CONN_PREIFX;

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
import com.baidu.hugegraph.entity.load.FileMapping;
import com.baidu.hugegraph.entity.load.FileUploadResult;
import com.baidu.hugegraph.exception.InternalException;
import com.baidu.hugegraph.options.HubbleOptions;
import com.baidu.hugegraph.service.load.FileMappingService;
import com.baidu.hugegraph.util.Ex;
import com.baidu.hugegraph.util.FileUtil;

import lombok.extern.log4j.Log4j2;

@Log4j2
@RestController
@RequestMapping(Constant.API_VERSION + "graph-connections/{connId}/upload-file")
public class FileUploadController {

    @Autowired
    private HugeConfig config;
    @Autowired
    private FileMappingService service;

    @PostMapping
    public FileUploadResult upload(@PathVariable("connId") int connId,
                                   @RequestParam("file") MultipartFile file,
                                   @RequestParam("total") int total,
                                   @RequestParam("index") int index) {
        // Now allowed to upload empty file
        Ex.check(!file.isEmpty(), "load.upload.file.cannot-be-empty");
        String location = this.config.get(HubbleOptions.UPLOAD_FILE_LOCATION);
        this.ensureLocationExist(location, CONN_PREIFX + connId);
        // Difficult: how to determine whether the file is csv or text
        log.info("File content type: {}", file.getContentType());

        // vertex_person.csv
        String fileName = file.getOriginalFilename();
        FileMapping oldMapping = this.service.get(connId, fileName);
        Ex.check(oldMapping == null, "There exist file with same name");

        // Before merge: upload-files/conn-1/verson_person.csv/part-1
        // After merge: upload-files/conn-1/file-mapping-1/verson_person.csv
        String dirPath = Paths.get(location, CONN_PREIFX + connId, fileName)
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
        FileUploadResult result = this.service.uploadFile(file, curPartFile);
        if (result.getStatus() == FileUploadResult.Status.FAILURE) {
            return result;
        }
        // Determine whether all the parts have been uploaded, then merge them
        boolean merged = this.service.tryMergePartFiles(dir, total);
        if (merged) {
            // Save file mapping
            FileMapping mapping = new FileMapping(connId, fileName, dirPath);
            // Read column names and values then fill it
            this.service.extractColumns(mapping);
            try {
                // TODO: maybe can get this info with tryMergePartFiles()
                mapping.setTotalLines(FileUtil.countLines(mapping.getPath()));
            } catch (IOException e) {
                throw new InternalException("Failed to count lines of file %s",
                                            mapping.getPath());
            }
            // Will generate mapping id
            if (this.service.save(mapping) != 1) {
                throw new InternalException("entity.insert.failed", mapping);
            }
            // Move to the directory corresponding to the file mapping Id
            String newPath = this.service.moveToNextLevelDir(mapping);
            // Update file mapping stored path
            mapping.setPath(newPath);
            if (this.service.update(mapping) != 1) {
                throw new InternalException("entity.update.failed", mapping);
            }
            result.setId(mapping.getId());
        }
        return result;
    }

    /**
     * TODO：需要组织好文件的路径，以及考虑是否删除文件映射
     */
    @DeleteMapping
    public Map<String, Boolean> delete(@PathVariable("connId") int connId,
                                       @RequestParam("names")
                                       List<String> fileNames) {
        Ex.check(fileNames.size() > 0, "load.upload.files.at-least-one");
        String location = this.config.get(HubbleOptions.UPLOAD_FILE_LOCATION);
        Map<String, Boolean> result = new LinkedHashMap<>();
        for (String fileName : fileNames) {
            String path = Paths.get(location, String.valueOf(connId), fileName)
                               .toString();
            File destFile = new File(path);
            boolean deleted = destFile.delete();
            result.put(fileName, deleted);
        }
        return result;
    }

    private void ensureLocationExist(String location, String connPath) {
        String path = Paths.get(location, connPath).toString();
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
