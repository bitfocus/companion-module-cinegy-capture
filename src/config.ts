import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string,
	engine: number,
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'Host',
			label: 'Host',
			default: '127.0.0.1',
			required: true,
			width: 16,
			regex: Regex.IP,
		},
		{
			type: 'number',
			id: 'EngineNumber',
			label: 'Capture Engine Number',
			min: 1,
			max: 9,
			default: 1,
			width: 1,
			required: true, 
			step: 1
		},
	]
}
