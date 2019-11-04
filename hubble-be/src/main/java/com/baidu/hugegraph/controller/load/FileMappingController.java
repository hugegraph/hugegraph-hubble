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

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.CollectionUtils;
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
import com.baidu.hugegraph.entity.load.EdgeMapping;
import com.baidu.hugegraph.entity.load.FileMapping;
import com.baidu.hugegraph.entity.load.FileSetting;
import com.baidu.hugegraph.entity.load.LoadParameter;
import com.baidu.hugegraph.entity.load.VertexMapping;
import com.baidu.hugegraph.entity.schema.EdgeLabelEntity;
import com.baidu.hugegraph.entity.schema.VertexLabelEntity;
import com.baidu.hugegraph.exception.ExternalException;
import com.baidu.hugegraph.exception.InternalException;
import com.baidu.hugegraph.service.load.FileMappingService;
import com.baidu.hugegraph.service.schema.EdgeLabelService;
import com.baidu.hugegraph.service.schema.VertexLabelService;
import com.baidu.hugegraph.util.Ex;
import com.baomidou.mybatisplus.core.metadata.IPage;

import lombok.extern.log4j.Log4j2;

@Log4j2
@RestController
@RequestMapping(Constant.API_VERSION + "graph-connections/{connId}/file-mappings")
public class FileMappingController extends BaseController {

    @Autowired
    private FileMappingService service;
    @Autowired
    private VertexLabelService vlService;
    @Autowired
    private EdgeLabelService elService;

    @GetMapping
    public IPage<FileMapping> list(@PathVariable("connId") int connId,
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

    @DeleteMapping("{id}")
    public void delete(@PathVariable("id") int id) {
        FileMapping mapping = this.service.get(id);
        if (mapping == null) {
            throw new ExternalException("load.file-mapping.not-exist.id", id);
        }

        int rows = this.service.remove(id);
        if (rows != 1) {
            throw new InternalException("entity.delete.failed", mapping);
        }
    }

    @PostMapping("{id}/file-setting")
    public FileMapping fileSetting(@PathVariable("id") int id,
                                   @RequestBody FileSetting newEntity) {
        Ex.check(!StringUtils.isEmpty(newEntity.getDelimiter()),
                 "load.file-mapping.file-setting.delimiter-cannot-be-empty");
        Ex.check(!StringUtils.isEmpty(newEntity.getCharset()),
                 "load.file-mapping.file-setting.charset-cannot-be-empty");
        Ex.check(!StringUtils.isEmpty(newEntity.getDateFormat()),
                 "load.file-mapping.file-setting.dateformat-cannot-be-empty");
        Ex.check(!StringUtils.isEmpty(newEntity.getTimeZone()),
                 "load.file-mapping.file-setting.timezone-cannot-be-empty");
        Ex.check(!StringUtils.isEmpty(newEntity.getSkippedLine()),
                 "load.file-mapping.file-setting.skippedline-cannot-be-empty");

        FileMapping mapping = this.service.get(id);
        if (mapping == null) {
            throw new ExternalException("load.file-mapping.not-exist.id", id);
        }

        FileSetting oldEntity = mapping.getFileSetting();
        FileSetting entity = this.mergeEntity(oldEntity, newEntity);
        mapping.setFileSetting(entity);
        // Read column names and values then fill it
        this.service.extractColumns(mapping);
        if (this.service.update(mapping) != 1) {
            throw new InternalException("entity.update.failed", mapping);
        }
        return mapping;
    }

    @PostMapping("{id}/vertex-mappings")
    public FileMapping addVertexMapping(@PathVariable("connId") int connId,
                                        @PathVariable("id") int id,
                                        @RequestBody VertexMapping newEntity) {
        VertexLabelEntity vl = this.vlService.get(newEntity.getLabel(), connId);
        Ex.check(!vl.getIdStrategy().isAutomatic(),
                 "load.file-mapping.vertex-mapping.automatic-id-unsupported");
        Ex.check(!CollectionUtils.isEmpty(newEntity.getIdFields()),
                 "load.file-mapping.vertex-mapping.id-fields-cannot-be-empty");

        FileMapping mapping = this.service.get(id);
        if (mapping == null) {
            throw new ExternalException("load.file-mapping.not-exist.id", id);
        }

        mapping.getVertexMappings().put(newEntity.getLabel(), newEntity);
        if (this.service.update(mapping) != 1) {
            throw new InternalException("entity.update.failed", mapping);
        }
        return mapping;
    }

    @DeleteMapping("{id}/vertex-mappings/{label}")
    public FileMapping deleteVertexMapping(@PathVariable("id") int id,
                                           @PathVariable("label") String label) {
        FileMapping mapping = this.service.get(id);
        if (mapping == null) {
            throw new ExternalException("load.file-mapping.not-exist.id", id);
        }

        VertexMapping oldEntity = mapping.getVertexMappings().remove(label);
        if (oldEntity == null) {
            throw new ExternalException(
                      "load.file-mapping.vertex-mapping.not-exist.label", label);
        }
        if (this.service.update(mapping) != 1) {
            throw new InternalException("entity.update.failed", mapping);
        }
        return mapping;
    }

    @PostMapping("{id}/edge-mappings")
    public FileMapping addEdgeMapping(@PathVariable("connId") int connId,
                                      @PathVariable("id") int id,
                                      @RequestBody EdgeMapping newEntity) {
        EdgeLabelEntity el = this.elService.get(newEntity.getLabel(), connId);
        VertexLabelEntity source = this.vlService.get(el.getSourceLabel(), connId);
        VertexLabelEntity target = this.vlService.get(el.getTargetLabel(), connId);
        Ex.check(!source.getIdStrategy().isAutomatic(),
                 "load.file-mapping.vertex-mapping.automatic-id-unsupported");
        Ex.check(!target.getIdStrategy().isAutomatic(),
                 "load.file-mapping.vertex-mapping.automatic-id-unsupported");
        Ex.check(!CollectionUtils.isEmpty(newEntity.getSourceFields()),
                 "load.file-mapping.edge-mapping.source-fields-cannot-be-empty");
        Ex.check(!CollectionUtils.isEmpty(newEntity.getSourceFields()),
                 "load.file-mapping.edge-mapping.target-fields-cannot-be-empty");

        FileMapping mapping = this.service.get(id);
        if (mapping == null) {
            throw new ExternalException("load.file-mapping.not-exist.id", id);
        }

        mapping.getEdgeMappings().put(newEntity.getLabel(), newEntity);
        if (this.service.update(mapping) != 1) {
            throw new InternalException("entity.update.failed", mapping);
        }
        return mapping;
    }

    @DeleteMapping("{id}/edge-mappings/{label}")
    public FileMapping deleteEdgeMapping(@PathVariable("id") int id,
                                         @PathVariable("label") String label) {
        FileMapping mapping = this.service.get(id);
        if (mapping == null) {
            throw new ExternalException("load.file-mapping.not-exist.id", id);
        }

        EdgeMapping oldEntity = mapping.getEdgeMappings().remove(label);
        if (oldEntity == null) {
            throw new ExternalException(
                      "load.file-mapping.edge-mapping.not-exist.label", label);
        }
        if (this.service.update(mapping) != 1) {
            throw new InternalException("entity.update.failed", mapping);
        }
        return mapping;
    }

    @PostMapping("{id}/load-parameter")
    public FileMapping loadParameter(@PathVariable("id") int id,
                                     @RequestBody LoadParameter newEntity) {
        FileMapping mapping = this.service.get(id);
        if (mapping == null) {
            throw new ExternalException("load.file-mapping.not-exist.id", id);
        }

        LoadParameter oldEntity = mapping.getLoadParameter();
        LoadParameter entity = this.mergeEntity(oldEntity, newEntity);
        mapping.setLoadParameter(entity);
        if (this.service.update(mapping) != 1) {
            throw new InternalException("entity.update.failed", mapping);
        }
        return mapping;
    }
}
