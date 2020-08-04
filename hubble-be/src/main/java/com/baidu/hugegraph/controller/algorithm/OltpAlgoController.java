package com.baidu.hugegraph.controller.algorithm;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baidu.hugegraph.common.Constant;
import com.baidu.hugegraph.entity.algorithm.ShortPath;
import com.baidu.hugegraph.entity.query.GremlinResult;
import com.baidu.hugegraph.service.algorithm.OltpAlgoService;
import com.baidu.hugegraph.service.query.ExecuteHistoryService;

import lombok.extern.log4j.Log4j2;

@Log4j2
@RestController
@RequestMapping(Constant.API_VERSION + "graph-connections/{connId}/algorithms")
public class OltpAlgoController {

    @Autowired
    private OltpAlgoService service;

    @PostMapping("shortpath")
    public GremlinResult shortPath(@PathVariable("connId") int connId,
                                   @RequestBody ShortPath body) {
        return this.service.shortPath(connId, body);
    }
}
