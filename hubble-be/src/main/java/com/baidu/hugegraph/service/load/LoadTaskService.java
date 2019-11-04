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
//import java.util.ArrayList;
//import java.util.HashMap;
//import java.util.List;
//import java.util.Map;
//import java.util.concurrent.locks.Lock;
//import java.util.concurrent.locks.ReentrantLock;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Isolation;
//import org.springframework.transaction.annotation.Transactional;
//
//import com.baidu.hugegraph.entity.GraphConnection;
//import com.baidu.hugegraph.entity.enums.LoadAction;
//import com.baidu.hugegraph.entity.load.FileSetting;
//import com.baidu.hugegraph.entity.load.EdgeMapping;
//import com.baidu.hugegraph.entity.load.FileMapping;
//import com.baidu.hugegraph.entity.load.LoadTask;
//import com.baidu.hugegraph.entity.load.VertexMapping;
//import com.baidu.hugegraph.loader.executor.LoadOptions;
//import com.baidu.hugegraph.loader.source.file.FileFormat;
//import com.baidu.hugegraph.loader.source.file.FileSource;
//import com.baidu.hugegraph.loader.source.file.SkippedLine;
//import com.baidu.hugegraph.loader.struct.EdgeStruct;
//import com.baidu.hugegraph.loader.struct.GraphStruct;
//import com.baidu.hugegraph.loader.struct.VertexStruct;
//import com.baidu.hugegraph.mapper.load.LoadTaskMapper;
//import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
//import com.baomidou.mybatisplus.core.metadata.IPage;
//import com.baomidou.mybatisplus.core.toolkit.Wrappers;
//import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
//
//import lombok.extern.log4j.Log4j2;
//
//@Log4j2
//@Service
//public class LoadTaskService {
//
//    @Autowired
//    private LoadTaskMapper mapper;
//
//    // TODO: 是否需要考虑并发同步？
//    private final Map<Integer, LoadScheduler> schedulers;
//    private final Lock lock;
//
//    public LoadTaskService() {
//        this.schedulers = new HashMap<>();
//        this.lock = new ReentrantLock();
//    }
//
//    public LoadTask get(int id) {
//        return this.mapper.selectById(id);
//    }
//
//    public List<LoadTask> listAll() {
//        return this.mapper.selectList(null);
//    }
//
//    public IPage<LoadTask> list(int connId, int pageNo, int pageSize) {
//        QueryWrapper<LoadTask> query = Wrappers.query();
//        query.eq("conn_id", connId).orderByDesc("name");
//        Page<LoadTask> page = new Page<>(pageNo, pageSize);
//        return this.mapper.selectPage(page, query);
//    }
//
//    public int count() {
//        return this.mapper.selectCount(null);
//    }
//
//    @Transactional(isolation = Isolation.READ_COMMITTED)
//    public int save(LoadTask entity) {
//        return this.mapper.insert(entity);
//    }
//
//    @Transactional(isolation = Isolation.READ_COMMITTED)
//    public int update(LoadTask entity) {
//        return this.mapper.updateById(entity);
//    }
//
//    @Transactional(isolation = Isolation.READ_COMMITTED)
//    public int remove(int id) {
//        return this.mapper.deleteById(id);
//    }
//
//    public LoadOptions buildLoadOptions(GraphConnection connection,
//                                        FileMapping fileMapping) {
//        LoadOptions options = new LoadOptions();
//        options.file = fileMapping.getPath();
//        // No need to specify a schema file
//        options.host = connection.getHost();
//        options.port = connection.getPort();
//        options.graph = connection.getGraph();
//        return options;
//    }
//
//    public GraphStruct buildGraphStruct(FileMapping fileMapping) {
//        // set input source
//        FileSource source = new FileSource();
//        source.path(fileMapping.getPath());
//        source.header(fileMapping.getHeader());
//
//        FileSetting fileSetting = fileMapping.getFileSetting();
//        source.charset(fileSetting.getCharset());
//        // NOTE: format and delimiter must be CSV and "," temporarily
//        source.format(FileFormat.valueOf(fileSetting.getFormat()));
//        source.delimiter(fileSetting.getDelimiter());
//        source.dateFormat(fileSetting.getDateFormat());
//        source.timeZone(fileSetting.getTimeZone());
//        source.skippedLine(new SkippedLine(fileSetting.getSkippedLine()));
//
//        List<VertexStruct> vertexStructs = new ArrayList<>();
//        for (VertexMapping mapping : fileMapping.getVertexMappings().values()) {
//            VertexStruct struct = new VertexStruct(mapping.getId());
//            // set label
//            struct.label(mapping.getLabel());
//            // set input source
//            struct.input(source);
//            // set id field
//            struct.idField(mapping.getId());
//            // set field_mapping
//            struct.mappingFields().putAll(mapping.getMappingFields());
//            // set value_mapping
//            struct.mappingValues().putAll(mapping.getMappingValues());
//            // set selected
//            struct.selectedFields().add(mapping.getId());
//            struct.selectedFields().addAll(mapping.getMappingFields().keySet());
//            // set null_values
//            struct.nullValues().addAll(mapping.getNullValues());
//
//            vertexStructs.add(struct);
//        }
//
//        List<EdgeStruct> edgeStructs = new ArrayList<>();
//        for (EdgeMapping mapping : fileMapping.getEdgeMappings().values()) {
//            List<String> sourceFields = mapping.getSourceFields();
//            List<String> targetFields = mapping.getTargetFields();
//            EdgeStruct struct = new EdgeStruct(sourceFields, targetFields);
//            // set label
//            struct.label(struct.label());
//            // set input source
//            struct.input(source);
//            // set source/target fields
//            struct.sourceFields().addAll(sourceFields);
//            struct.targetFields().addAll(targetFields);
//            // set field_mapping
//            struct.mappingFields().putAll(mapping.getMappingFields());
//            // set value_mapping
//            struct.mappingValues().putAll(mapping.getMappingValues());
//            // set selected
//            struct.selectedFields().addAll(sourceFields);
//            struct.selectedFields().addAll(targetFields);
//            struct.selectedFields().addAll(mapping.getMappingFields().keySet());
//            // set null_values
//            struct.nullValues().addAll(mapping.getNullValues());
//
//            edgeStructs.add(struct);
//        }
//
//        return new GraphStruct(vertexStructs, edgeStructs);
//    }
//
//    public void handleLoadTask(LoadOptions options, GraphStruct struct,
//                               LoadAction action) {
//        LoadScheduler scheduler = new LoadScheduler(options, struct, this.lock);
//        switch (action) {
//            case START:
//                scheduler.startLoad();
//                break;
//            case PAUSE:
//                scheduler.pauseLoad();
//                break;
//            case RESUME:
//                scheduler.resumeLoad();
//                break;
//            case STOP:
//                scheduler.stopLoad();
//                break;
//            default:
//                throw new AssertionError(String.format(
//                          "Unknown load action '%s'", action));
//        }
//    }
//}
