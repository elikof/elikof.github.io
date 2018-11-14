const restMeasurdData = {
    rest_status: null,
    thr_diff: 1,
    thr_std: 1,
    iter: 0,
    t_acc: 1,
    rest_count: 1,
    version: '2'
}

let rest_arr_x = [];
let rest_arr_y = [];
let rest_arr_z = [];
let rest_arr_xR = [];
let rest_arr_yR = [];
let rest_arr_zR = [];

let accCount = 0;
let rotCount = 0;


function addRestAccReading(x, y, z){
	accCount++;
	rest_arr_x.push(x);
	rest_arr_y.push(y);
	rest_arr_z.push(z);
    console.log("acc: " +accCount);    
    if (accCount > 30 && rotCount > 30) {
        accCount = 0;
        rotCount = 0;
        rest_arr_x = [];
        rest_arr_y = [];
        rest_arr_z = [];    
        rest_arr_xR = [];
        rest_arr_yR = [];
        rest_arr_zR = [];    
        restMeasurd(rest_arr_x, rest_arr_y, rest_arr_z, rest_x_rot, rest_y_rot, rest_z_rot, restMeasurdData.thr_diff, restMeasurdData.thr_std, restMeasurdData.iter, restMeasurdData.t_acc, restMeasurdData.rest_status, restMeasurdData.rest_count);       
        document.getElementById("btnStart").innerHTML=""+restMeasurdData.rest_status;
    }
}
function addRestRotReading(x, y, z){
    console.log("rot: " +rotCount);
    rotCount++;
	rest_arr_xR.push(x);
	rest_arr_yR.push(y);
	rest_arr_zR.push(z);
}

function restMeasurd(x_acc, y_acc, z_acc, x_rot, y_rot, z_rot, thr_diff, thr_std, iter, t_acc, begin_move_triger, rest_status, rest_count) {

    let smooth_xacc = movingAvg(x_acc, 3);
    for (let value of smooth_xacc) {
        value -= math.mean(value);
    }
    console.log("smooth xacc: " + smooth_xacc);
    let xidPks = pksLocation(smooth_xacc.slice(1, smooth_xacc.length - 1)).idPks;
    xidPks = math.add(xidPks, 1);
    console.log("xidPks: " + xidPks);

    // Y //

    let smooth_yacc = movingAvg(y_acc, 3);
    for (let value of smooth_yacc) {
        value -= math.mean(value);
    }
    console.log("smooth yacc: " + smooth_yacc);
    let yidPks = pksLocation(smooth_yacc.slice(1, smooth_yacc.length - 1)).idPks;
    yidPks = math.add(yidPks, 1);
    console.log("yidPks: " + yidPks);

    // Z //

    let smooth_zacc = movingAvg(z_acc, 3);
    for (let value of smooth_zacc) {
        value -= math.mean(value);
    }
    console.log("smooth zacc: " + smooth_zacc);
    let zidPks = pksLocation(smooth_zacc.slice(1, smooth_zacc.length - 1)).idPks;
    zidPks = math.add(zidPks, 1);
    console.log("zidPks: " + zidPks);


    if (xidPks.length > 5 && xidPks.length < 9) {
        let peak_diff = diffArr(xidPks);
        let peak_amp = math.abs(math.subset(smooth_xacc, math.index(xidPks)));
        console.log("peak- amp: " + peak_amp + " diff: " + peak_diff);
        if (math.max(peak_amp) < 1.3 * math.mean(peak_amp) && math.min(peak_amp) > 0.7 * math.mean(peak_amp) &&
            math.max(peak_diff) < 1.1 * math.mean(peak_diff) && math.min(peak_diff) > 0.9 * math.mean(peak_diff)) {
            x_acc = math.subtract(x_acc, smooth_xacc);
        }
    }
    console.log("x_acc: " + x_acc);

    // Y //

    if (yidPks.length > 5 && yidPks.length < 9) {
        let peak_diff = diffArr(yidPks);
        let peak_amp = math.abs(math.subset(smooth_yacc, math.index(yidPks)));
        console.log("peak- amp: " + peak_amp + " diff: " + peak_diff);
        if (math.max(peak_amp) < 1.3 * math.mean(peak_amp) && math.min(peak_amp) > 0.7 * math.mean(peak_amp) &&
            math.max(peak_diff) < 1.1 * math.mean(peak_diff) && math.min(peak_diff) > 0.9 * math.mean(peak_diff)) {
            y_acc = math.subtract(y_acc, smooth_yacc);
        }
    }
    console.log("y_acc: " + y_acc);

    // Z //

    if (zidPks.length > 5 && zidPks.length < 9) {
        let peak_diff = diffArr(zidPks);
        let peak_amp = math.abs(math.subset(smooth_zacc, math.index(zidPks)));
        console.log("peak- amp: " + peak_amp + " diff: " + peak_diff);
        if (math.max(peak_amp) < 1.3 * math.mean(peak_amp) && math.min(peak_amp) > 0.7 * math.mean(peak_amp) &&
            math.max(peak_diff) < 1.1 * math.mean(peak_diff) && math.min(peak_diff) > 0.9 * math.mean(peak_diff)) {
            z_acc = math.subtract(z_acc, smooth_zacc);
        }
    }
    console.log("z_acc: " + z_acc);

// init vars //

    let thr_acc_rest = math.min(math.min(rest_count), 1.5) * 1.8; // initial acc threshold
    let thr_rot_rest = math.min(math.min(rest_count), 2) * 0.004; // initial rot threshold

    let xacc_std = math.zeros(3);
    let yacc_std = math.zeros(3);
    let zacc_std = math.zeros(3);

    let xrot_diff = math.zeros(3);
    let yrot_diff = math.zeros(3);
    let zrot_diff = math.zeros(3);

    let len_acc = math.floor(x_acc.length / 3); // Third of acc lenght
    let len_rot = math.floor(x_rot.length / 3); // Third of rot lenght


// if the previous burst had rest (rest = 2) but there was no beep,
// rest_status remain 2 if rest, reset to 0 if movement

    if (rest_status == 2 && begin_move_triger == 0) {
        for (let i = 0; i < 3; i++) {
            xacc_std[i] = math.std(x_acc.slice(0, len_acc));
            yacc_std[i] = math.std(y_acc.slice(0, len_acc));
            zacc_std[i] = math.std(z_acc.slice(0, len_acc));
            xrot_diff[i] = math.max(math.abs(diffArr(x_rot.slice(0, len_rot))));
            yrot_diff[i] = math.max(math.abs(diffArr(y_rot.slice(0, len_rot))));
            zrot_diff[i] = math.max(math.abs(diffArr(z_rot.slice(0, len_rot))));
        }
        const med_xstd = math.median(xacc_std);
        const med_ystd = math.median(yacc_std);
        const med_zstd = math.median(zacc_std);
        const med_xdiff = math.median(xrot_diff);
        const med_ydiff = math.median(yrot_diff);
        const med_zdiff = math.median(zrot_diff);
        const max_std = math.max(med_xstd, med_ystd, med_zstd);
        const max_diff = math.max(med_xdiff, med_ydiff, med_zdiff);
        if ((max_std > 8 * thr_std && max_diff > 10 * thr_diff) || (max_diff > 20 * thr_diff)) {
            restMeasurdData.iter = 0;
            restMeasurdData.rest_status = 0;
        }

        // rest_status updated to 3 if the user started measuring

        const params = sasParam(x_acc, y_acc, z_acc, x_rot, y_rot, z_rot, len_acc);
        const cond_1 = params.max_std > 3 * thr_std && params.max_diff > 3 * thr_diff && params.max_ratio > 2;
        const cond_2 = (params.max_diff > 5 * thr_diff) || (params.max_std > 5 * thr_std && params.max_diff > 3 * thr_diff);
        if (cond_1 || cond_2) {
            restMeasurdData.iter = iter + 1;
        }
        if (iter > 2) {
            restMeasurdData.rest_status = 3;
            restMeasurdData.iter = 0;
        }
    }


//Check if the user started moving again after second rest
    if (rest_status == 4) {
        const params = sasParam(x_acc, y_acc, z_acc, x_rot, y_rot, z_rot, len_acc);
        const cond_1 = params.max_std > 3 * thr_std && params.max_diff > 3 * thr_diff && params.max_ratio > 2;
        const cond_2 = (params.max_diff > 5 * thr_diff) || (params.max_std > 5 * thr_std && params.max_diff > 3 * thr_diff);
        if (cond_1 || cond_2) {
            restMeasurdData.iter = iter + 1;
        }
        if (iter > 5) {
            restMeasurdData.rest_status = 3;
            restMeasurdData.iter = 3;
        }
    }


// Change status according to iteration number
    if (iter == 0) {
        const params = sasParam(x_acc, y_acc, z_acc, x_rot, y_rot, z_rot, len_acc);
        if (params.max_ratio < thr_acc_rest && params.max_diff < thr_rot_rest) {
            restMeasurdData.iter = 1;
        }
        restMeasurdData.rest_count = rest_count + 1;
        restMeasurdData.rest_status = 0;
    }


//  if we detected rest

    if (iter == 1) {
        restMeasurdData.rest_status = 2;
        restMeasurdData.iter = iter + 1;
        len_acc = math.floor(len_acc / 6);
        const x_std = math.zeros(5);
        const y_std = math.zeros(5);
        const z_std = math.zeros(5);
        for (let i = 1; i < 6; i++) {
            x_std[i - 1] = math.std(x_acc.slice((i - 1) * len_acc + 1, (i + 1) * len_acc));
            y_std[i - 1] = math.std(y_acc.slice((i - 1) * len_acc + 1, (i + 1) * len_acc));
            z_std[i - 1] = math.std(z_acc.slice((i - 1) * len_acc + 1, (i + 1) * len_acc));
        }
        const med_xstd = math.median(x_std);
        const med_ystd = math.median(y_std);
        const med_zstd = math.median(z_std);
        restMeasurdData.thr_std = math.mean(med_xstd, med_ystd, med_zstd) + 0.01;

        const med_xdiff = math.median(math.abs(diffArr(x_rot)));
        const med_ydiff = math.median(math.abs(diffArr(y_rot)));
        const med_zdiff = math.median(math.abs(diffArr(z_rot)));
        restMeasurdData.thr_diff = math.max(med_xdiff, med_ydiff, med_zdiff, 0.0025);
    }

    // rest, now check for movement
// increment iter if we detected movement

    if (iter == 2) {
        const params = sasParam(x_acc, y_acc, z_acc, x_rot, y_rot, z_rot, len_acc);
        const cond_1 = params.max_std > 3 * thr_std && params.max_diff > 3 * thr_diff && params.max_ratio > 2;
        const cond_2 = (params.max_diff > 5 * thr_diff) || (params.max_std > 5 * thr_std && params.max_diff > 3 * thr_diff);
        if (cond_1 || cond_2) {
            restMeasurdData.iter = iter + 1;
        }
        if (begin_move_triger == 1 && iter > 2) {
            restMeasurdData.rest_status = 3;
            restMeasurdData.rest_count = 1;
        }
        else if (iter > 2) {
            restMeasurdData.iter = 0;
            restMeasurdData.rest_status = 0;
        }
    }


// movement

    if (iter >= 3) {
        restMeasurdData.iter = rest_after_movment(x_acc, y_acc, z_acc, x_rot, y_rot, z_rot, iter, thr_std, thr_diff, len_acc, len_rot);

    }

// second rest
    if (iter >= 4) {

        restMeasurdData.rest_status = 4;
        restMeasurdData.iter = iter + 1;
    }

    if (rest_status == 0) {
        restMeasurdData.rest_count = rest_count + 1;
    }
}


// sub functions //

function movingAvg(data, window) {
    let windowArr = [];
    let avgArr = [];
    for (let i = 0; i < (data.length - 1); i++) {
        if (i + 2 < window) {
            windowArr.push(i + 2);
        }
        else if ((data.length - 1) - i + 1 < window) {
            windowArr.push((data.length - 1) - i + 1);
        }
        else {
            windowArr.push(window);
        }
    }
    for (let i = 0; i < windowArr.length; i++) {
        if (i == 0) {
            avgArr.push(data[i]);
        }
        let tempAvg = 0;
        for (let j = 0; j < windowArr[i]; j++) {
            tempAvg += data[i + j];
        }
        avgArr.push(tempAvg / windowArr[i]);
    }
    return avgArr;
}

function pksLocation(arr) {
    let pks = [];
    let idPks = [];
    let dArr = diffArr(arr);
    for (let i = 1; i < dArr.length; i++) {
        if (dArr[i - 1] > 0.1 && dArr[i] < -0.1) {
            pks.push(arr[i]);
            idPks.push(i);
        }
    }
    console.log("pks: " + pks);
    console.log("idpks: " + idPks);
    return {
        pks: pks,
        idPks: idPks
    };
}

function diffArr(arr) {
    let temp = [];
    for (let i = 1; i < arr.length; i++) {
        temp.push(math.sign(arr[i] - arr[i - 1]));
    }
    return temp;
}

function sasParam(x_acc, y_acc, z_acc, x_rot, y_rot, z_rot, len_acc) {
    const num_seg = 5;
    len_acc = math.floor(len_acc / (num_seg + 1));

    const x_std = math.zeros(num_seg);
    const y_std = math.zeros(num_seg);
    const z_std = math.zeros(num_seg);
    for (let i = 1; i < 6; i++) {
        x_std[i - 1] = math.std(x_acc.slice((i - 1) * len_acc + 1, (i + 1) * len_acc));
        y_std[i - 1] = math.std(y_acc.slice((i - 1) * len_acc + 1, (i + 1) * len_acc));
        z_std[i - 1] = math.std(z_acc.slice((i - 1) * len_acc + 1, (i + 1) * len_acc));
    }
    const x_med_std = math.abs(math.median(x_std));
    const y_med_std = math.abs(math.median(y_std));
    const z_med_std = math.abs(math.median(z_std));
    const max_std = math.max(x_med_std, y_med_std, z_med_std);

    const x_ratio_acc = math.abs((0.01 + math.max(x_std)) / (0.01 + math.median(x_std)));
    const y_ratio_acc = math.abs((0.01 + math.max(y_std)) / (0.01 + math.median(y_std)));
    const z_ratio_acc = math.abs((0.01 + math.max(z_std)) / (0.01 + math.median(z_std)));
    const max_ratio = math.max(x_ratio_acc, y_ratio_acc, z_ratio_acc);

    const x_diff = math.abs(diffArr(x_rot));
    const y_diff = math.abs(diffArr(y_rot));
    const z_diff = math.abs(diffArr(z_rot));
    const x_med_diff = math.abs(math.median(x_diff));
    const y_med_diff = math.abs(math.median(y_diff));
    const z_med_diff = math.abs(math.median(z_diff));
    const max_diff = math.max(x_med_diff, y_med_diff, z_med_diff);

    return {
        max_std: max_std,
        max_ratio: max_ratio,
        max_diff: max_diff
    }
}

function rest_after_movment(x_acc, y_acc, z_acc, x_rot, y_rot, z_rot, iter, thr_std, thr_diff, len_acc, len_rot) {

// This function checks for rest after movement.
// If rest was detected the value of kk in incremented.

// init vars
    const num_seg = 5;

//  acc std ratio
    const l1 = math.floor(len_acc / (num_seg + 1));
    const x_std = math.zeros(num_seg);
    const y_std = math.zeros(num_seg);
    const z_std = math.zeros(num_seg);

    for (let i = 1; i <= num_seg; i++) {
        x_std[i - 1] = math.std(x_acc.slice((i - 1) * l1 + 1, (i + 1) * l1));
        y_std[i - 1] = math.std(y_acc.slice((i - 1) * l1 + 1, (i + 1) * l1));
        z_std[i - 1] = math.std(z_acc.slice((i - 1) * l1 + 1, (i + 1) * l1));
    }

    const sort_x = math.sort(x_std);
    const sort_y = math.sort(y_std);
    const ratio_x = math.abs((0.01 + sort_x[sort_x.length - 1]) / (0.01 + math.median(x_std)));
    const ratio_y = math.abs((0.01 + sort_y[sort_y.length - 1]) / (0.01 + math.median(y_std)));
    const ratio_z = math.abs((0.01 + math.max(z_std)) / (0.01 + math.median(z_std)));
    const max_std = math.max(math.max(x_std), math.max(y_std), math.max(z_std));
    const max_ratio_acc = math.max(ratio_x, ratio_y, ratio_z);

// rot std ratio
    const l2 = math.floor(len_rot / (num_seg + 1));
    const x_rot_std = math.zeros(num_seg);
    const y_rot_std = math.zeros(num_seg);
    const z_rot_std = math.zeros(num_seg);

    for (let i = 1; i <= num_seg; i++) {
        x_rot_std[i - 1] = math.std(x_rot.slice((i - 1) * l2 + 1, (i + 1) * l2));
        y_rot_std[i - 1] = math.std(x_rot.slice((i - 1) * l2 + 1, (i + 1) * l2));
        z_rot_std[i - 1] = math.std(x_rot.slice((i - 1) * l2 + 1, (i + 1) * l2));
    }

    const sort_x_rot = math.sort(x_rot_std);
    const sort_y_rot = math.sort(y_rot_std);
    const ratio_x_rot = math.abs((0.01 + sort_x_rot[sort_x_rot - 1]) / (0.01 + math.median(x_rot_std)));
    const ratio_y_rot = math.abs((0.01 + sort_y_rot[sort_y_rot - 1]) / (0.01 + math.median(y_rot_std)));
    const ratio_z_rot = math.abs((0.01 + math.max(z_rot_std)) / (0.01 + math.median(z_rot_std)));
    const max_ratio_rot = math.max(ratio_x_rot, ratio_y_rot, ratio_z_rot);

// diff
    const diff_x = math.max(math.abs(diffArr(x_rot)));
    const diff_y = math.max(math.abs(diffArr(y_rot)));
    const diff_z = math.max(math.abs(diffArr(z_rot)));
    const max_diff = math.max(diff_x, diff_y, diff_z);

// range
    const range_acc_x = math.max(x_acc) - math.min(x_acc);
    const range_acc_y = math.max(y_acc) - math.min(y_acc);
    const range_acc_z = math.max(z_acc) - math.min(z_acc);
    const range_acc = math.max(range_acc_x, range_acc_y, range_acc_z);

    const range_rot_x = math.abs(math.max(x_rot) - math.min(x_rot));
    const range_rot_y = math.abs(math.max(y_rot) - math.min(y_rot));
    const range_rot_z = math.abs(math.max(z_rot) - math.min(z_rot));
    const range_rot = math.max(range_rot_x, range_rot_y, range_rot_z);

// max std
    const mid_vec = math.floor(0.5 * len_acc);
    const mid_std_acc_x = math.max(math.std(math.abs(x_acc.slice(0, mid_vec))), math.std(math.abs(x_acc.slice(mid_vec))));
    const mid_std_acc_y = math.max(math.std(math.abs(y_acc.slice(0, mid_vec))), math.std(math.abs(y_acc.slice(mid_vec))));
    const mid_std_acc_z = math.max(math.std(math.abs(z_acc.slice(0, mid_vec))), math.std(math.abs(z_acc.slice(mid_vec))));
    const mid_std_acc = math.max(mid_std_acc_x, mid_std_acc_y, mid_std_acc_z);

    const mid_vec_rot = math.floor(0.5 * len_rot);
    const mid_std_rot_x = math.max(math.std(math.abs(x_rot.slice(0, mid_vec_rot))), math.std(math.abs(x_rot.slice(mid_vec_rot))));
    const mid_std_rot_y = math.max(math.std(math.abs(y_rot.slice(0, mid_vec_rot))), math.std(math.abs(y_rot.slice(mid_vec_rot))));
    const mid_std_rot_z = math.max(math.std(math.abs(z_rot.slice(0, mid_vec_rot))), math.std(math.abs(z_rot.slice(mid_vec_rot))));
    const mid_std_rot = math.max(mid_std_rot_x, mid_std_rot_y, mid_std_rot_z);

// check for rest
    if (max_ratio_acc < 2 && max_diff < 0.05 && max_ratio_rot < 2 && range_rot_x < 0.08 && range_rot_y < 0.08 && range_rot_z < 0.08) {
        return iter + 1;
    }


    if (max_std < thr_std && max_diff < thr_diff) {
        return iter + 1;
    }

    if (range_acc < 0.03 && range_rot < 0.2 && mid_std_acc < 0.01 && mid_std_rot < 0.07) {
        return iter + 1;
    }
}
