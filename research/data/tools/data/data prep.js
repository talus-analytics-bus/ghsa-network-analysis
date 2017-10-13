output = [];
allData.forEach(project => {
	var obj = {};
	obj.project_title = project.project_name;
	obj.core_capacities = project.core_capacities.join('; ');
	obj.desc_trns = project.desc_trns;
	obj.title_trns = project.title_trns;
	
	obj.iati_id = project.source.id;
	
	// get sector codes
	
	output.push(obj);
});
copy(output)