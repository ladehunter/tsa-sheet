import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

URL = "file:///home/haoluo/tsa_pwa/index.html"

CHECK_JS = """
return (function () {
  var r = {};
  r.scrollW = document.documentElement.scrollWidth;
  r.clientW = document.documentElement.clientWidth;
  r.bodyFont = parseFloat(getComputedStyle(document.body).fontSize);
  r.innerW = window.innerWidth;
  var smallInputs = [];
  document.querySelectorAll("input").forEach(function (i) {
    if (i.type === "checkbox" || i.type === "file") return;
    var rc = i.getBoundingClientRect();
    if (rc.height === 0) return;
    var fs = parseFloat(getComputedStyle(i).fontSize);
    if (fs < 16) smallInputs.push((i.id || i.type) + ":" + fs);
  });
  r.smallInputs = smallInputs;
  var smallTaps = [];
  document.querySelectorAll("button, .segbtn, .wday, .navbtn, .chip, .dtab").forEach(function (b) {
    var rc = b.getBoundingClientRect();
    if (rc.height === 0 && rc.width === 0) return;
    var vis = rc.height > 0 && rc.width > 0;
    if (vis && (rc.height < 44 || rc.width < 44)) {
      if (b.className.indexOf("sheet-x") >= 0 || b.className.indexOf("rmjump") >= 0) return;
      smallTaps.push(b.className + "@" + Math.round(rc.height) + "x" + Math.round(rc.width));
    }
  });
  r.smallTaps = smallTaps;
  return r;
})();
"""

def run(width, height, tag):
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--window-size=%d,%d" % (width, height))
    opts.add_argument("--hide-scrollbars")
    pass
    d = webdriver.Chrome(options=opts)
    try:
        d.execute_cdp_cmd("Emulation.setDeviceMetricsOverride", {
            "width": width, "height": height, "deviceScaleFactor": 2, "mobile": True
        })
        d.get(URL)
        time.sleep(0.8)
        res = d.execute_script(CHECK_JS)
        print("[%s win=%s css] scrollW=%s clientW=%s innerW=%s bodyFont=%s smallInputs=%s smallTaps=%s" %
              (tag, width, res["scrollW"], res["clientW"], res["innerW"], res["bodyFont"],
               res["smallInputs"], res["smallTaps"]))
        d.save_screenshot("/tmp/opencode/v3/shot_%s_train.png" % tag)

        d.find_element(By.CSS_SELECTOR, ".navbtn[data-tab='diet']").click()
        time.sleep(0.5)
        res2 = d.execute_script(CHECK_JS)
        print("[%s diet] scrollW=%s clientW=%s" % (tag, res2["scrollW"], res2["clientW"]))
        d.save_screenshot("/tmp/opencode/v3/shot_%s_diet.png" % tag)

        d.find_element(By.CSS_SELECTOR, ".navbtn[data-tab='cardio']").click()
        time.sleep(0.5)
        res3 = d.execute_script(CHECK_JS)
        print("[%s cardio] scrollW=%s clientW=%s" % (tag, res3["scrollW"], res3["clientW"]))
        d.save_screenshot("/tmp/opencode/v3/shot_%s_cardio.png" % tag)

        d.find_element(By.CSS_SELECTOR, ".navbtn[data-tab='weight']").click()
        time.sleep(0.5)
        res4 = d.execute_script(CHECK_JS)
        print("[%s weight] scrollW=%s clientW=%s" % (tag, res4["scrollW"], res4["clientW"]))
        d.save_screenshot("/tmp/opencode/v3/shot_%s_weight.png" % tag)

        # open more menu -> manual
        d.find_element(By.ID, "moreBtn").click()
        time.sleep(0.4)
        d.save_screenshot("/tmp/opencode/v3/shot_%s_more.png" % tag)
        d.find_element(By.ID, "mmManual").click()
        time.sleep(0.5)
        d.execute_script("document.querySelectorAll('#manualBody .msec')[8] && document.querySelectorAll('#manualBody .msec')[8].classList.add('open')")
        d.save_screenshot("/tmp/opencode/v3/shot_%s_manual.png" % tag)

        # program placeholder visual
        d.execute_script("document.querySelector('.sheet-x').click()")
        time.sleep(0.3)
        d.find_element(By.CSS_SELECTOR, ".navbtn[data-tab='train']").click()
        time.sleep(0.3)
        seg = d.execute_script("return document.querySelectorAll('#progSeg .segbtn')[1]")
        seg.click()
        time.sleep(0.4)
        d.save_screenshot("/tmp/opencode/v3/shot_%s_placeholder.png" % tag)
        m = d.execute_script("return document.querySelector('#cards .ph') ? document.querySelector('#cards .ph').textContent : 'MISSING'")
        print("[%s placeholder] %s" % (tag, m[:60]))

        ls = d.execute_script("return Object.keys(localStorage).sort()")
        print("[%s localStorage] %s" % (tag, ls))
    finally:
        d.quit()

run(360, 780, "w360")
run(390, 844, "w390")
print("DONE")
