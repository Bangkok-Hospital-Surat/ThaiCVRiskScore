/*!
* Thai CV risk score 2.5
* Copyright 2021
* Released under the Rama license.
age 30-70 year, smoke 0-1, dm 0-1, sbp 70-220 mmHg, sex 0-1, lipid mg/dL, wc in cm, weight in kg, height in cm
*/
function ThaiASCVD(lang) {
    //GET VALUE
    var tc = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);    //age, smoke, dm, sbp, sex, tc, ldl, hdl, whr, wc, height
    if ($("#age").val() != '') { tc[0] = parseInt($("#age").val()) };
    tc[1] = parseInt($("#smoke").val());
    tc[2] = parseInt($("#dm").val());
    if ($("#sbp").val() != '') { tc[3] = parseInt($("#sbp").val()) };
    tc[4] = parseInt($("#sex").val());
    if ($("#tc").val() != '') { tc[5] = parseInt($("#tc").val()) };
    //if ($("#ldl").val() != '') { tc[6] = parseInt($("#ldl").val()) };     //Cancle 2021-04-23
    //if ($("#hdl").val() != '') { tc[7] = parseInt($("#hdl").val()) };     //Cancle 2021-04-23
    if ($("#wc").val() != '') { tc[9] = parseInt(parseFloat($("#wc").val()) * 2.5) };   //Convert inch to cm
    if ($("#bdh").val() != '') { tc[10] = parseInt($("#bdh").val()) };
    if (tc[9] > 0 && tc[10] > 0) { tc[8] = tc[9] / tc[10] };
    //PROTOCOL
    if ($("#blood_off").is(":checked") == true) {
        tc[5] = 0;
        tc[6] = 0;
        tc[7] = 0;
    } else if ($("#blood_on").is(":checked") == true) {
        tc[9] = 0;
        tc[8] = 0;
    };
    //FORMULAR
    var sum_risk = new Array();
    sum_risk = TASCVDformular(tc[0], tc[1], tc[2], tc[3], tc[4], tc[5], tc[6], tc[7], tc[8], tc[9]);
    //Display
    if (sum_risk[1] > 0) {
        if (lang == 'th') {
            $.mobile.changePage("#regat2");
            var tt_risk = (sum_risk[1] / sum_risk[3]).toFixed(1);
            //******* Update 2021-04-23
            if (sum_risk[1] <= 0.3) {
                $("#sc2").text((sum_risk[1] * 100).toFixed(2));
            } else {
                $("#sc2").text('มากกว่า 30');
            };
            if (tt_risk > 1.1) {
                $("#sc1").text('ซึ่งระดับความเสี่ยงของท่านสูงเป็น ' + String(tt_risk) + ' เท่า');
            } else if (tt_risk < 0.9) {
                $("#sc1").text('ซึ่งระดับความเสี่ยงของท่านต่ำเป็น ' + String(tt_risk) + ' เท่า');
            } else {
                $("#sc1").text('ซึ่งใกล้เคียงกับระดับความเสี่ยง');
            };
            //Group of risk and suggestion
            var sug = '';
            if (tc[1] == 1) { sug = sug + ' เลิกสูบบุหรี่' };
            if (tc[2] == 1) { sug = sug + ' รักษาระดับน้ำตาลในเลือดให้อยู่ในเกณฑ์ปกติ' };
            if (tc[3] >= 140) { sug = sug + ' ควบคุมระดับความดันโลหิตให้ดี' };
            if (tc[5] >= 220 || tc[6] >= 190) { sug = sug + ' เข้ารับการรักษาเพื่อลดโคเรสเตอรอลในเลือด' };
            if ((tc[9] >= 38 && tc[4] == 1) || (tc[9] > 32 && tc[4] == 0)) { sug = sug + ' ลดน้ำหนักให้อยู่ในเกณฑ์ปกติ' };
            if (sum_risk[1] < 0.1) {
                $("#sc5").text("จัดอยู่ในกลุ่มเสี่ยงน้อย");
                $("#sc4").text("เพื่อป้องกันการเกิดโรคหลอดเลือดในอนาคต ควรออกกำลังกายอย่างสม่ำเสมอ รับประทานผักผลไม้เป็นประจำ" + sug + " และตรวจสุขภาพประจำปี");
            } else if (sum_risk[1] >= 0.1 && sum_risk[1] < 0.2) {
                $("#sc5").text("จัดอยู่ในกลุ่มเสี่ยงปานกลาง");
                $("#sc4").text("ควรออกกำลังกายอย่างสม่ำเสมอ รับประทานผักผลไม้เป็นประจำ" + sug + " และควรได้รับการตรวจร่างกายประจำปีอย่างสม่ำเสมอ");
            } else if (sum_risk[1] >= 0.2 && sum_risk[1] <= 0.3) {
                $("#sc5").text("จัดอยู่ในกลุ่มเสี่ยงสูง");
                $("#sc4").text("ควรเข้ารับคำปรึกษาจากแพทย์ ในเบื้องต้นควรออกกำลังกายอย่างสม่ำเสมอ รับประทานผักผลไม้เป็นประจำ" + sug + " และเข้ารับการตรวจสุขภาพประจำปีอย่างสม่ำเสมอ");
            } else if (sum_risk[1] > 0.3) {    //******* Update 2021-04-23
                $("#sc5").text("จัดอยู่ในกลุ่มเสี่ยงสูงมาก");
                $("#sc4").text("ควรเข้ารับคำปรึกษาจากแพทย์ ในเบื้องต้นควรออกกำลังกายอย่างสม่ำเสมอ รับประทานผักผลไม้เป็นประจำ" + sug + " และเข้ารับการตรวจสุขภาพประจำปีอย่างสม่ำเสมอ");
            } else {
                $("#sc5").text("ไม่พบความเสี่ยง");
                $("#sc4").text("สามารถป้องกันการเกิดโรคหลอดเลือดหัวใจในอนาคตได้ด้วยการออกกำลังกายอย่างสม่ำเสมอ");
            };
        } else if (lang == 'en') {
            $.mobile.changePage("#eegat2");
            var tt_risk = (sum_risk[1] / sum_risk[3]).toFixed(1);
            //******* Update 2021-04-23
            if (sum_risk[1] <= 0.3) {
                $("#sc2").text((sum_risk[1] * 100).toFixed(2));
            } else {
                $("#sc2").text('is over 30');
            };
            if (tt_risk > 1.1) {
                $("#sc1").text('that is higher about ' + String(tt_risk) + ' times ');
            } else if (tt_risk < 0.9) {
                $("#sc1").text('that is lower about ' + String(tt_risk) + ' times ');
            } else {
                $("#sc1").text('that has no different ');
            };
            //Group of risk and suggestion
            var sug = '';
            if (tc[1] == 1) { sug = sug + ', quit smoking' };
            if (tc[2] == 1) { sug = sug + ', keep blood sugar level within normal range' };
            if (tc[3] >= 140) { sug = sug + ', achieve goal of blood pressure controlling' };
            if (tc[5] >= 220 || tc[6] >= 190) { sug = sug + ', intensify cholesterol-lowering therapy' };
            if ((tc[9] >= 38 && tc[4] == 1) || (tc[9] > 32 && tc[4] == 0)) { sug = sug + ', body weight lowering' };
            if (sum_risk[1] < 0.1) {
                $("#sc5").text("classified as low risk");
                $("#sc4").text("It is reasonable to prevent atherosclerotic cardiovascular disease in the future by regular execise, high fiber dietary" + sug + " and annual health checkup.");
            } else if (sum_risk[1] >= 0.1 && sum_risk[1] < 0.2) {
                $("#sc5").text("classified as medium risk");
                $("#sc4").text("You should have regular execise, high fiber dietary" + sug + " and annual health checkup.");
            } else if (sum_risk[1] >= 0.2 && sum_risk[1] <= 0.3) {
                $("#sc5").text("classified as high risk");
                $("#sc4").text("You must visit the physician for health checkup and recieve properly therapy. You must have regular execise, high fiber dietary" + sug + " now.");
            } else if (sum_risk[1] > 0.3) {        //******* Update 2021-04-23
                $("#sc5").text("classified as very high risk");
                $("#sc4").text("You must visit the physician for health checkup and recieve properly therapy. You must have regular execise, high fiber dietary" + sug + " now.");
            } else {
                $("#sc5").text("no risk");
                $("#sc4").text("Regular exercise could help you prevent atherosclerotic cardiovascular disease in the future.");
            };
        };
    };
};
function TASCVDformular(age, smoke, dm, sbp, sex, tc, ldl, hdl, whr, wc) {
    //FORMULAR
    var full_score = 0;
    var compare_score = 0;
    var predicted_risk = 0;
    var compare_risk = 0;
    var compare_whr = 0.52667;
    var compare_wc = 79;
    var compare_sbp = 120;
    var compare_hdl = 44;
    var sur_root = 0.964588;
    if (sex == 0) { compare_hdl = 49 };
    if (sex == 1 && age > 60) { compare_sbp = 132 };
    if (sex == 0 && age <= 60) { compare_sbp = 115 };
    if (sex == 0 && age > 60) { compare_sbp = 130 };
    if (sex == 1) {
        compare_whr = 0.58125;      //****Update 2021-04-23
        compare_wc = 93;
    };
    //****Update 2021-04-23 ยุบเหลือ 3 สูตร เท่านั้น
    if (age > 1 && sbp >= 70) {
        if (tc > 0) {       //Using Total cholesterol from blood test
            full_score = (0.08183 * age) + (0.39499 * sex) + (0.02084 * sbp) + (0.69974 * dm) + (0.00212 * tc) + (0.41916 * smoke);
            predicted_risk = 1 - (Math.pow(sur_root, Math.exp(full_score - 7.04423)));
            compare_score = (0.08183 * age) + (0.39499 * sex) + (0.02084 * compare_sbp) + (0.00212 * 200);
            compare_risk = 1 - (Math.pow(sur_root, Math.exp(compare_score - 7.04423)));
        } else if (whr > 0) {
            full_score = (0.079 * age) + (0.128 * sex) + (0.019350987 * sbp) + (0.58454 * dm) + (3.512566 * whr) + (0.459 * smoke);
            predicted_risk = 1 - (Math.pow(sur_root, Math.exp(full_score - 7.712325)));     
            compare_score = (0.079 * age) + (0.128 * sex) + (0.019350987 * compare_sbp) + (3.512566 * compare_whr);
            compare_risk = 1 - (Math.pow(sur_root, Math.exp(compare_score - 7.712325)));  
        } else if (wc > 0) {
            full_score = (0.08372 * age) + (0.05988 * sex) + (0.02034 * sbp) + (0.59953 * dm) + (0.01283 * wc) + (0.459 * smoke);
            predicted_risk = 1 - (Math.pow(sur_root, Math.exp(full_score - 7.31047)));
            compare_score = (0.08372 * age) + (0.05988 * sex) + (0.02034 * compare_sbp) + (0.01283 * compare_wc);
            compare_risk = 1 - (Math.pow(sur_root, Math.exp(compare_score - 7.31047)));
        };        
    };
    //if (predicted_risk > 0.3) { predicted_risk = 0.3 };   //***Update เปลี่ยนเป็น หากมากกว่า 0.3 ให้แจ้งว่า มากกว่า 30% เท่านั้น เช่น 0.42 แจ้งว่า มากกว่า 30%
    var risk = new Array(full_score, predicted_risk, compare_score, compare_risk);
    return risk;
};
function bloodshift() {     //******* Update 2021-04-23
    if ($("#blood_off").is(":checked") == true) {
        //alert("NO BLOOD");
        $('#tc').slider('disable');
        //$('#ldl').slider('disable');
        //$('#hdl').slider('disable');
        $('#wc').slider('enable');
        $('#bdh').slider('enable');
        $('.selector').slider('refresh');
    } else if ($("#blood_on").is(":checked") == true) {
        //alert("TEST");
        $('#tc').slider('enable');
        //$('#ldl').slider('enable');
        //$('#hdl').slider('enable');
        $('#wc').slider('disable');
        $('#bdh').slider('disable');
        $('.selector').slider('refresh');
    };
};