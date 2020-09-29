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

import java.util.ArrayList;
import java.util.List;

import org.datanucleus.util.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.common.Response;
import com.baidu.hugegraph.entity.enums.JobManagerStatus;
import com.baidu.hugegraph.entity.enums.LoadStatus;
import com.baidu.hugegraph.entity.load.FileMapping;
import com.baidu.hugegraph.entity.load.JobManager;
import com.baidu.hugegraph.entity.load.JobManagerReasonResult;
import com.baidu.hugegraph.entity.load.LoadTask;
import com.baidu.hugegraph.exception.ExternalException;
import com.baidu.hugegraph.exception.InternalException;
import com.baidu.hugegraph.service.load.FileMappingService;
import com.baidu.hugegraph.service.load.JobManagerService;
import com.baidu.hugegraph.service.load.LoadTaskService;
import com.baidu.hugegraph.util.Ex;
import com.baidu.hugegraph.util.HubbleUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;

import lombok.extern.log4j.Log4j2;

@Log4j2
@RestController
@RequestMapping(Constant.API_VERSION + "graph-connections/{connId}/job-manager")
public class JobManagerController {

    private static final int LIMIT = 500;

    private final JobManagerService service;
    @Autowired
    private FileMappingService fmService;
    @Autowired
    private LoadTaskService taskService;

    @Autowired
    public JobManagerController(JobManagerService service) {
        this.service = service;
    }

    @PostMapping
    public JobManager create(@PathVariable("connId") int connId,
                             @RequestBody JobManager entity) {
        synchronized (this.service) {
            Ex.check(entity.getJobName().length() <= 48,
                     "job.manager.job-name.reached-limit");
            Ex.check(entity.getJobName() != null, () ->
                     Constant.COMMON_NAME_PATTERN.matcher(entity.getJobName()).matches(),
                                                          "job.manager.job-name.unmatch-regex");
            Ex.check(entity.getJobRemarks().length() <= 200,
                     "job.manager.job-remarks.reached-limit");
            Ex.check(!StringUtils.isEmpty(entity.getJobRemarks()), () ->
                     Constant.COMMON_REMARK_PATTERN.matcher(entity.getJobRemarks()).matches(),
                                                            "job.manager.job-remarks.unmatch-regex");
            Ex.check(this.service.count() < LIMIT,
                     "job.manager.reached-limit", LIMIT);
            if (this.service.getTask(entity.getJobName(), connId) != null) {
                throw new InternalException("job.manager.job-name.repeated");
            }
            entity.setConnId(connId);
            entity.setJobStatus(JobManagerStatus.DEFAULT);
            entity.setJobDuration(0L);
            entity.setJobSize(0L);
            entity.setUpdateTime(HubbleUtil.nowDate());
            entity.setCreateTime(HubbleUtil.nowDate());
            int rows = this.service.save(entity);
            if (rows != 1) {
                throw new InternalException("entity.insert.failed", entity);
            }
        }
        return entity;
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable("id") int id) {
        JobManager task = this.service.get(id);
        if (task == null) {
            throw new ExternalException("job.manager.not-exist.id", id);
        }
        if (this.service.remove(id) != 1) {
            throw new InternalException("entity.delete.failed", task);
        }
    }

    @GetMapping("{id}")
    public JobManager get(@PathVariable("id") int id) {
        JobManager job = this.service.get(id);
        if (job == null) {
            throw new ExternalException("job.manager.not-exist.id", id);
        }
        return job;
    }

    @GetMapping("ids")
    public List<JobManager> list(@PathVariable("connId") int connId,
                                 @RequestParam("job_ids") List<Integer> jobIds) {
        return this.service.list(connId, jobIds);
    }

    @GetMapping
    public IPage<JobManager> list(@PathVariable("connId") int connId,
                                  @RequestParam(name = "page_no",
                                                required = false,
                                                defaultValue = "1")
                                                int pageNo,
                                  @RequestParam(name = "page_size",
                                                required = false,
                                                defaultValue = "10")
                                                int pageSize,
                                  @RequestParam(name = "content",
                                                required = false,
                                                defaultValue = "")
                                                String content) {
        return this.service.list(connId, pageNo, pageSize, content);
    }

    @PutMapping("{id}")
    public JobManager update(@PathVariable("id") int id,
                             @RequestBody JobManager newEntity) {
        Ex.check(newEntity.getJobName().length() <= 48,
                 "job.manager.job-name.reached-limit");
        Ex.check(newEntity.getJobName() != null, () ->
                 Constant.COMMON_NAME_PATTERN
                         .matcher(newEntity.getJobName()).matches(),
                 "job.manager.job-name.unmatch-regex");
        Ex.check(newEntity.getJobRemarks().length() <= 200,
                 "job.manager.job-remarks.reached-limit");
        // Check exist Job Manager with this id
        JobManager entity = this.service.get(id);
        if (entity == null) {
            throw new ExternalException("job-manager.not-exist.id", id);
        }
        entity.setJobName(newEntity.getJobName());
        entity.setJobRemarks(newEntity.getJobRemarks());
        if (this.service.update(entity) != 1) {
            throw new InternalException("entity.update.failed", entity);
        }
        return entity;
    }

    @GetMapping("{id}/reason")
    public Response reason(@PathVariable("connId") int connId,
                           @PathVariable("id") int id) {
        JobManager job = this.service.get(id);
        if (job == null) {
            throw new ExternalException("job.manager.not-exist.id", id);
        }
        List<LoadTask> tasks = taskService.batchTasks(job.getId());
        List<JobManagerReasonResult> reasonResults = new ArrayList<>();
        tasks.forEach(task -> {
            JobManagerReasonResult reasonResult = new JobManagerReasonResult();
            int fileId = task.getFileId();
            String reason = "";
            if (task.getStatus() == LoadStatus.FAILED) {
                FileMapping mapping = this.fmService.get(fileId);
                reason = this.taskService.readLoadFailedReason(mapping);
            }
            reasonResult.setTaskId(task.getJobId());
            reasonResult.setFileId(task.getFileId());
            reasonResult.setFileName(task.getFileName());
            reasonResult.setReason(reason);
            reasonResults.add(reasonResult);
        });
        return Response.builder()
                       .status(Constant.STATUS_OK)
                       .data(reasonResults)
                       .build();
    }
}
