/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.Card;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettingsOld extends DataViewObjectsParser {
    public lollipopSettings: LollipopSettings = new LollipopSettings();
}

export class LollipopSettingsOld {
    // Default color
    public defaultColor: string = "#202020";
    public dataPointColor: string = "#B6960B";
    public radius: number = 10;
    public lineWidth: number = 3;
    // Text Size
    public fontSize: number = 12;
    public fontFamily: string = "Arial, sans-serif"
}

class LollipopSettings extends FormattingSettingsCard {
    defaultColor = new formattingSettings.ColorPicker({
        name: "defaultColor",
        displayName: "Default color",
        value: { value: "#202020" }
    });

    dataPointColor = new formattingSettings.ColorPicker({
        name: "dataPointColor",
        displayName: "Data Point Color",
        value: { value: "#B6960B" }
    });

    radius = new formattingSettings.Slider({
        name: "radius",
        displayName: "Radius",
        value: 10
    });

    lineWidth = new formattingSettings.NumUpDown({
        name: "lineWidth",
        displayName: "Line Width",
        value: 3
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text Size",
        value: 12
    });

    font = new formattingSettings.FontControl(
        {
            name: "font",
            displayName: "Font",
            fontFamily: new formattingSettings.FontPicker({
                name: "fontFamily",
                value: "Arial, sans-serif"
            }),
            fontSize: new formattingSettings.NumUpDown({
                name: "fontSize",
                value: 12
            })
        }
    );

    name: string = "lollipopSettings";
    displayName: string = "Lollipop Settigngs";
    slices: Array<FormattingSettingsSlice> = [this.defaultColor, this.dataPointColor, this.radius, this.lineWidth, this.fontSize, this.font];
}

/**
* visual settings model class
*
*/
export class VisualSettings extends FormattingSettingsModel {
    // Create formatting settings model formatting cards
    lollipopSettings = new LollipopSettings();

    cards = [this.lollipopSettings];
}