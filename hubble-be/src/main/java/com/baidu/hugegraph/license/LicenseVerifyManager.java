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

package com.baidu.hugegraph.license;

import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.baidu.hugegraph.config.HugeConfig;
import com.baidu.hugegraph.exception.ExternalException;
import com.baidu.hugegraph.options.HubbleOptions;
import com.baidu.hugegraph.util.E;
import com.baidu.hugegraph.util.Log;
import com.baidu.hugegraph.util.VersionUtil;
import com.baidu.hugegraph.version.HubbleVersion;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import de.schlichtherle.license.LicenseContent;
import de.schlichtherle.license.LicenseContentException;
import de.schlichtherle.license.LicenseParam;

public class LicenseVerifyManager extends CommonLicenseManager {

    private static final Logger LOG = Log.logger(LicenseVerifyManager.class);

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private HugeConfig config;
    private final MachineInfo machineInfo;

    public LicenseVerifyManager(LicenseParam param) {
        super(param);
        this.machineInfo = new MachineInfo();
    }

    public void config(HugeConfig config) {
        this.config = config;
    }

    public HugeConfig config() {
        E.checkState(this.config != null,
                     "License verify manager has not been installed");
        return this.config;
    }

    @Override
    protected synchronized void validate(LicenseContent content) {
        // call super validate firstly
        try {
            super.validate(content);
        } catch (LicenseContentException e) {
            throw new ExternalException("Failed to verify license", e);
        }

        // Verify the customized license parameters.
        List<ExtraParam> extraParams;
        try {
            TypeReference<?> type = new TypeReference<List<ExtraParam>>() {};
            extraParams = MAPPER.readValue((String) content.getExtra(), type);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read extra params", e);
        }

        String serverId = this.getServerId();
        LOG.debug("server id is {}", serverId);
        ExtraParam param = this.matchParam(serverId, extraParams);
        if (param == null) {
            throw new ExternalException(
                      "The current server's id is not authorized");
        }

        this.checkVersion(param);
        this.checkIpAndMac(param);
    }

    private String getServerId() {
        return this.config().get(HubbleOptions.SERVER_ID);
    }

    private ExtraParam matchParam(String id, List<ExtraParam> extraParams) {
        for (ExtraParam param : extraParams) {
            if (param.id().equals(id)) {
                return param;
            }
        }
        return null;
    }

    private void checkVersion(ExtraParam param) {
        String expectVersion = param.version();
        if (StringUtils.isEmpty(expectVersion)) {
            return;
        }
        VersionUtil.Version acutalVersion = HubbleVersion.VERSION;
        if (acutalVersion.compareTo(VersionUtil.Version.of(expectVersion)) > 0) {
            throw newLicenseException(
                  "The server's version '%s' exceeded the authorized '%s'",
                  acutalVersion.get(), expectVersion);
        }
    }

    private void checkIpAndMac(ExtraParam param) {
        String expectIp = param.ip();
        if (StringUtils.isEmpty(expectIp)) {
            return;
        }
        boolean matched = false;
        List<String> actualIps = this.machineInfo.getIpAddress();
        for (String actualIp : actualIps) {
            if (actualIp.equalsIgnoreCase(expectIp)) {
                matched = true;
                break;
            }
        }
        if (!matched) {
            throw newLicenseException(
                  "The server's ip '%s' doesn't match the authorized '%s'",
                  actualIps, expectIp);
        }

        String expectMac = param.mac();
        if (StringUtils.isEmpty(expectMac)) {
            return;
        }
        String actualMac;
        try {
            actualMac = this.machineInfo.getMacByInetAddress(
                        InetAddress.getByName(expectIp));
        } catch (UnknownHostException e) {
            throw newLicenseException(
                  "Failed to get mac address for ip '%s'", expectIp);
        }
        String expectFormatMac = expectMac.replaceAll(":", "-");
        String actualFormatMac = actualMac.replaceAll(":", "-");
        if (!actualFormatMac.equalsIgnoreCase(expectFormatMac)) {
            throw newLicenseException(
                  "The server's mac '%s' doesn't match the authorized '%s'",
                  actualMac, expectMac);
        }
    }

    private ExternalException newLicenseException(String message,
                                                  Object... args) {
        return new ExternalException(message, args);
    }
}
