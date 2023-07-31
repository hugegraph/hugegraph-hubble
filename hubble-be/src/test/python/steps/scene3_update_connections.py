# -*- coding: UTF-8 -*-
from behave import *
import requests
import sys
import json

reload(sys)
sys.setdefaultencoding('utf8')
use_step_matcher("re")


@when("update connections -- request_host: (?P<text>.+)")
def step_impl(context, text):
    """
    :param text:
    :type context: behave.runner.Context
    """
    http_url = "http://" + text + "/api/v1.1/graph-connections"
    res = requests.get(url=http_url)
    context.http_url = http_url
    context.res_json = res.json()


@given("update connections")
def step_impl(context):
    """
    :type context: behave.runner.Context
    """
    res_json = context.res_json
    if res_json["status"] == 200:
        json_res = res_json["data"]["records"][0]
        id = json_res["id"]
        update_url = context.http_url+"/"+str(id)
        update_json = {"name": "updateConnections", "graph": json_res["graph"], "host": json_res["host"],
                       "port": json_res["port"]}
        res_update = requests.put(url=update_url, json=update_json)
        context.update_jn = res_update.json()
    else:
        print 'create connection : failed !'
        assert False


@then("update connections -- (?P<ass>.+)")
def step_impl(context, ass):
    """
    :type context: behave.runner.Context
    :type ass: str
    """
    update_jn = context.update_jn
    print "update_jn -- "+str(update_jn)
    ass_json = json.loads(ass)
    print "ass_json -- "+str(ass_json)
    assert (update_jn["status"] == ass_json["status"]) and (ass_json["message"] == str(update_jn["message"]))

