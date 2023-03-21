'use strict'

import powerbi from "powerbi-visuals-api"
import { dataViewObject } from "powerbi-visuals-utils-dataviewutils"
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions
import IVisualHost = powerbi.extensibility.visual.IVisualHost
import ISelectionId = powerbi.extensibility.ISelectionId

export interface VData {
    items: VDataItem[],
    minValue: number,
    maxValue: number,
    target: number,
    formatString: string
}

export interface VDataItem {
    category: string,
    value: number,
    color: string
    selectionId: ISelectionId
}

export function transformData(option: VisualUpdateOptions, host: IVisualHost, defaultColor: string): VData {
    let data: VData

    try {
      const dv = option.dataViews[0].categorical
      //const minValue = Math.min(<number>dv.values[0].minLocal, <number>dv.values[1].minLocal||<number>dv.values[0].minLocal)
      console.log(dv.values);
      const minValue = Math.min(...<number[]>Array.from(dv.values, d => <number>d.minLocal))
      //const maxValue = Math.max(<number>dv.values[0].maxLocal, <number>dv.values[1].maxLocal)
      const maxValue = Math.max(...<number[]>Array.from(dv.values, d => <number>d.maxLocal))
      const target = (dv.values[1])? <number>dv.values[1].values[0] :0 ;
      const items: VDataItem[] = [];
      let color: string;
      for (let i=0; i < dv.categories[0].values.length; i++) {
        try {
          color = dv.categories[0].objects[i].lollipopSettings.dataPointColor['solid'].color
        }
        catch(error){
          color = defaultColor
        }
        const selectionId = host.createSelectionIdBuilder()
          .withCategory(dv.categories[0], i)
          .createSelectionId()
        if(dv?.values[0].values[i])  {items.push({
              category: <string>dv.categories[0].values[i],
              value: <number>dv?.values[0].values[i],
              color,
              selectionId
          })}
      }
      data = {
        items,
        minValue,
        maxValue,
        target,
        formatString: <string>dv.values[0].source.format || ''
      }

    } catch (error) {
        console.log(error);
        data = {
            items: [],
            minValue: 0,
            maxValue: 0,
            target: 0,
            formatString: ''
        }
    }
    return data
}