package com.baidu.hugegraph.controller.load;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.baidu.hugegraph.common.Constant;

import lombok.extern.log4j.Log4j2;

@Log4j2
@Controller
@RequestMapping(Constant.API_VERSION + "graph-connections/{connId}/upload-file")
public class UploadPageController {

    @GetMapping("page")
    public String uploadPage() {
        return "upload";
    }
}
