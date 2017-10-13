output = [];
allData.forEach(project => {
	var obj = {};
	obj.unique_id = project.project_id
	obj.project_title = project.project_name;
	obj.core_capacities = project.core_capacities.join('; ');
	obj.desc_trns = project.desc_trns;
	obj.title_trns = project.title_trns;
	
	obj.iati_id = project.source.id;
	
	// get sector codes
	var activities_for_proj = iatiActivities.filter(d => d.aid === project.source.id);
	var curSectorCodes = _.unique(_.pluck(activities_for_proj, 'sector_code'));
	obj.sector_codes = curSectorCodes.join('; ');
	output.push(obj);
});
copy(output)