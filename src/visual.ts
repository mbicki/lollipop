/*
*  Power BI Visual CLI
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

import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbi.extensibility.visual.IVisualHost
import ISelectionId = powerbi.extensibility.ISelectionId
import ISelectionManager = powerbi.extensibility.ISelectionManager

import { valueFormatter, textMeasurementService } from "powerbi-visuals-utils-formattingutils"
import measureSvgTextWidth = textMeasurementService.measureSvgTextWidth
import { transformData, VData, VDataItem } from "./transformData"
import { setStyle } from "./setstyle"
import { VisualSettings } from "./settings";
import { ScalePoint, scalePoint, ScaleLinear, scaleLinear } from "d3-scale";
import { Selection, select, selectAll } from "d3-selection";
import { easeLinear, transition, range, easeBounce, easeBack, easeQuadInOut, easeQuadIn, easePolyInOut } from "d3";
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";
import VisualEnumerationInstanceKinds = powerbi.VisualEnumerationInstanceKinds;
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private data: VData;
    private sm: ISelectionManager;
    private svg: Selection<SVGElement, any, HTMLElement, any>;
    private scaleX: ScalePoint<string>;
    private scaleY: ScaleLinear<number, number>;
    private dim: [number, number];
    private transition: d3.Transition<any, any, any, any>
    private host: IVisualHost
    private groupPoints: Selection<SVGElement, any, any, any> 
    private formattingSettingsService: FormattingSettingsService;

    constructor(options: VisualConstructorOptions) {
        this.formattingSettingsService = new FormattingSettingsService();
        console.log('Visual constructor', options);
        this.target = options.element;
        this.host = options.host;
        this.sm = this.host.createSelectionManager();
        if (document) {
            this.svg = select(this.target).append('svg');
        }
        this.drawBackground();
        this.groupPoints = this.svg.append('g') 
    }

    public update(options: VisualUpdateOptions) {
        this.settings = this.formattingSettingsService.populateFormattingSettingsModel(VisualSettings, options.dataViews);
        setStyle(this.settings);
        //this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        console.log('Visual update', options);
        console.log('dataPointColor', this.settings.lollipopSettings.dataPointColor.value.value);
        this.data = transformData(options, this.host, this.settings.lollipopSettings.dataPointColor.value.value);

        
        this.dim = [options.viewport.width, options.viewport.height]
        this.svg.attr('width', this.dim[0]);
        this.svg.attr('height', this.dim[1]);
        

        const targetLabelWidth = this.getTextWidth(this.formatMeasure(this.data.target, this.data.formatString))

        this.scaleX = scalePoint()
            .domain(Array.from(this.data.items, d => d.category))
            .range([0, this.dim[0] - targetLabelWidth - this.settings.lollipopSettings.font.fontSize.value / 2])
            .padding(0.5)

        const strokeGap = this.settings.lollipopSettings.lineWidth.value

        const allValuesAboveTarget = this.data.minValue > this.data.target
        const allValuesBelowTarget = this.data.maxValue< this.data.target
        const gap = this.settings.lollipopSettings.font.fontSize.value * 1.5
        const bottomOffset = (allValuesAboveTarget)? gap:0
        const topOffset = (allValuesBelowTarget)? gap:0

        this.scaleY = scaleLinear()
            .domain([this.data.minValue, this.data.maxValue])
            .range(
                [this.dim[1] - this.settings.lollipopSettings.radius.value - strokeGap -gap,
                this.settings.lollipopSettings.radius.value + strokeGap])

        this.transition = transition().duration(500).ease(easePolyInOut)

        this.drawTarget();
        // this.drawConnectors();
        // this.drawDataPoints();
        this.drawLolipop();
        // this.drawCategoryLabels();

    }

    private drawTarget() {
        this.drawTargetLabel();
        let targetLine = this.svg.selectAll('line.target-line').data([this.data.target])
        targetLine
            .enter()
            .append('line')
            .classed('target-line', true)
            .attr('x1', 0)
            .attr('y1', this.scaleY(this.data.target))
            .attr('x2', this.scaleX.range()[1])
            .attr('y2', this.scaleY(this.data.target));

        targetLine
            .transition(this.transition)
            .attr('x1', 0)
            .attr('y1', this.scaleY(this.data.target))
            .attr('x2', this.scaleX.range()[1])
            .attr('y2', this.scaleY(this.data.target))

        targetLine.exit().remove();
    }

    private drawTargetLabel() {
        let targetLabel = this.svg.selectAll('text.target-label').data([this.data.target])
        targetLabel
            .enter()
            .append('text')
            .classed('target-label', true)
            .attr('x', this.scaleX.range()[1] + this.settings.lollipopSettings.font.fontSize.value / 2)
            .attr('y', this.scaleY(this.data.target))
            .attr('font-size', `${this.settings.lollipopSettings.font.fontSize.value}pt`)
            .attr('font-family', this.settings.lollipopSettings.font.fontFamily.value)
            .text(this.formatMeasure(this.data.target, this.data.formatString))

        targetLabel
            .transition(this.transition)
            .attr('x', this.scaleX.range()[1] + this.settings.lollipopSettings.font.fontSize.value / 2)
            .attr('y', this.scaleY(this.data.target))
            .attr('font-size', `${this.settings.lollipopSettings.font.fontSize.value}pt`)
            .attr('font-family', this.settings.lollipopSettings.font.fontFamily.value)
            .text(this.formatMeasure(this.data.target, this.data.formatString))

        targetLabel.exit().remove();
    }

    private drawBackground(){
        this.svg.selectAll('rect.background').remove();
        const background = this.svg.append('rect')
            .classed("background", true)
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("opacity", 0)
        background.on('click', (e) => {
            console.log('click')
            this.sm.clear()
            selectAll('.data-point')
                .classed('selected', true)
                .classed('unselected', false)
            })
    }

    private drawLolipop() {
        
        const dataPoints = this.groupPoints.selectAll('g.data-point').data(this.data.items)
        const onClick=(e, g:Selection<any,any,any,any>) => {
            const isAnyPrevSelection = g.filter('.unselected').size()>0;
            const isCtrl = e.ctrlKey;
            const el = select(e.target.parentElement)
            const d = <{ selectionId: ISelectionId }>e.target.__data__.selectionId
            this.sm.select(d, isCtrl).then((selected) => {
                switch(true) {
                    case (!isAnyPrevSelection || !isCtrl):
                            selectAll('g.data-point')
                            .classed('selected', false)
                            .classed('unselected', true)
                        el
                            .classed('selected', true)
                            .classed('unselected', false)
                    break
                    case (g.filter('.selected').size()===1 && el.classed('selected')):
                        selectAll('g.data-point')
                            .classed('selected', true)
                            .classed('unselected', false)
                    break
                    case (isAnyPrevSelection && isCtrl && el.classed('selected')):
                        el
                            .classed('unselected', true)
                            .classed('selected', false)
                    break
                    default:
                        const prevSelection = g.filter('.selected');
                        selectAll([...el, ...prevSelection])
                            .classed('selected', true)
                            .classed('unselected', false)
                    break

                }
            })
        }
        dataPoints
            .join(
                enter => {
                    let g = enter.append('g')
                        .classed('data-point', true)
                        .on('click', (e) => onClick(e,g))
                    g.append('circle')
                        .attr('ix', (d, i) => i)
                        .attr('cx', d => this.scaleX(d.category))
                        .attr('cy', this.scaleY(this.data.target))
                        .attr('r', 0)
                        .attr('fill', d => d.color)
                        .transition(this.transition)
                        .attr('cy', d => this.scaleY(d.value))
                        .attr('r', this.settings.lollipopSettings.radius.value)
                    g.append('line')
                        .classed('connector', true)
                        .attr('ix', (d, i) => i)
                        .attr('x1', d => this.scaleX(d.category))
                        .attr('x2', d => this.scaleX(d.category))
                        .attr('y1', this.scaleY(this.data.target))
                        .attr('y2', this.scaleY(this.data.target))
                        .transition(this.transition)
                        .attr('y2', (d) => {
                            var spacing = this.settings.lollipopSettings.radius.value;
                            spacing = (this.data.target <= d.value) ? spacing : -spacing;
                            return this.scaleY(d.value) + spacing
                        })

                        g
                        .append('text')
                        .classed('category-label', true)
                        .attr('x', d => this.scaleX(d.category))
                        .attr('y', d => {
                            var gap = this.settings.lollipopSettings.font.fontSize.value * 1.5
                            gap = (d.value >= this.data.target) ? gap : -gap
                            return this.scaleY(this.data.target) + gap
                        })
                        .attr('opacity',0)
                        .text(d => d.category)
                        .transition(this.transition)
                            .attr('opacity',1)
                        
                    return null
                },

                update => {
                    let g = update.select('g.data-point')
                    g.on('click', (e) => onClick(e,g))
                    update.select('circle').transition(this.transition)
                        .attr('cx', d => this.scaleX(d.category))
                        .attr('cy', d => this.scaleY(d.value))
                        .attr('r', this.settings.lollipopSettings.radius.value)
                        .attr('fill', d => d.color)
                    update.select('.connector').transition(this.transition)
                        .attr('ix', (d, i) => i)
                        .attr('x1', d => this.scaleX(d.category))
                        .attr('x2', d => this.scaleX(d.category))
                        .attr('y1', this.scaleY(this.data.target))
                        .attr('y2', (d) => {
                            var spacing = this.settings.lollipopSettings.radius.value;
                            spacing = (this.data.target <= d.value) ? spacing : -spacing;
                            return this.scaleY(d.value) + spacing
                        })
                    update.transition(this.transition).select('text.category-label')
                        .attr('x', d => this.scaleX(d.category))
                        .attr('y', d => {
                            var gap = this.settings.lollipopSettings.font.fontSize.value * 1.5
                            gap = (d.value >= this.data.target) ? gap : -gap
                            return this.scaleY(this.data.target) + gap
                        })
                        .text(d => d.category)
                    return update
                },
                exit => exit.remove()


            )

        dataPoints.exit().remove();
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }
    private drawCategoryLabels() {
        const catLabels = this.svg.selectAll('text.category-label').data(this.data.items)

        catLabels
            .enter()
            .append('text')
            .classed('category-label', true)
            .attr('x', d => this.scaleX(d.category))
            .attr('y', d => {
                var gap = this.settings.lollipopSettings.font.fontSize.value * 1.5
                gap = (d.value >= this.data.target) ? gap : -gap
                return this.scaleY(this.data.target) + gap
            })
            .text(d => d.category)

        catLabels
            .transition(this.transition)
            .attr('x', d => this.scaleX(d.category))
            .attr('y', d => {
                var gap = this.settings.lollipopSettings.font.fontSize.value * 1.5
                gap = (d.value >= this.data.target) ? gap : -gap
                return this.scaleY(this.data.target) + gap
            })
            .text(d => d.category)

        catLabels.exit().remove();
    }

    // private static parseSettings(dataView: DataView): VisualSettings {
    //     return <VisualSettings>VisualSettings.parse(dataView);
    // }

    private formatMeasure(measure: number, fs: string): string {
        const formatter = valueFormatter.create({ format: fs })
        return formatter.format(measure)
    }

    private getTextWidth(txt: string): number {
        const textProperties = {
            text: txt,
            fontFamily: this.settings.lollipopSettings.font.fontFamily.value,
            fontSize: `${this.settings.lollipopSettings.font.fontSize.value}pt`
        }
        return measureSvgTextWidth(textProperties)
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    // public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
    //     const objectName: string = options.objectName;
    //     const objectEnumeration: VisualObjectInstance[] = []

    //     switch (objectName) {
    //         case 'lollipopSettings':

    //             objectEnumeration.push(
    //                 {
    //                     objectName,
    //                     properties: {
    //                         dataPointColor: this.settings.lollipopSettings.dataPointColor
    //                     },
    //                     selector: dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals),
    //                     altConstantValueSelector: this.settings.lollipopSettings.dataPointColor,
    //                     propertyInstanceKind: { dataPointColor: VisualEnumerationInstanceKinds.ConstantOrRule }
    //                 }
    //             )
    //             objectEnumeration.push(
    //                 {
    //                     objectName,
    //                     properties: {
    //                         defaultColor: this.settings.lollipopSettings.defaultColor,
    //                         fontFamily: this.settings.lollipopSettings.font.fontFamily,
    //                         fontSize: this.settings.lollipopSettings.font.fontSize,
    //                         lineWidth: this.settings.lollipopSettings.lineWidth,
    //                         radius: this.settings.lollipopSettings.radius
    //                     },
    //                     selector: null
    //                 }
    //             )
    //             break
    //     }

    //     // return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    //     return objectEnumeration

    // }
}