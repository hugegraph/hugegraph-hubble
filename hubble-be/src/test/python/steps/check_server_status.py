# -*- coding: UTF-8 -*-

from behave import *
import requests
import sys
import json

reload(sys)
sys.setdefaultencoding('utf8')
use_step_matcher("re")

@when("scene:(?P<scene>.+) url:(?P<url>.+)")
def step_impl(context, scene, url):
    http_url = "http://" + url + "/api/v1.1/actuator/health"
    res = requests.get(http_url)
    context.res_json = res.json()

@then("response:(?P<response>.+)")
def step_impl(context, response):
    res_json = context.res_json
    ass_json = json.loads(response)

    assert ass_json["status"] == res_json["status"]

