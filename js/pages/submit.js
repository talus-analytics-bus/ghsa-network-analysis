(() => {
	App.initSubmit = () => {
		// connect link to glossary page
		$('.glossary-button').click(() => hasher.setHash('glossary'));

		// upload completed project report
		$('.submit-button').click(() => {
			// check that contact fields are filled out
			const firstName = $('.first-name-input').val();
			const lastName = $('.last-name-input').val();
			const org = $('.org-input').val();
			const email = $('.email-input').val();
			if (!firstName) {
				noty({ text: 'Enter a first name before proceeding.' });
				return;
			}
			if (!lastName) {
				noty({ text: 'Enter a last name before proceeding.' });
				return;
			}
			if (!org) {
				noty({ text: 'Enter an organization before proceeding.' });
				return;
			}
			if (!email) {
				noty({ text: 'Enter an email address before proceeding.' });
				return;
			}

			const input = d3.select('.input-report-upload').node();
			if ('files' in input) {
				if (!input.files.length) return;  // check that file was uploaded
				const file = input.files[0];

				// check that file is in xls or xlsx format
				const fileNameArr = file.name.split('.');
				const fileType = fileNameArr[fileNameArr.length - 1];
				if (fileType !== 'xlsx' && fileType !== 'xls') {
					noty({
						timeout: 5000,
						text: '<b>Please select a file with a file type ' +
							'extension of <i>.xls</i> or <i>.xlsx</i>',
					});
					return;
				}

				// read and ingest
				const reader = new FileReader();
				reader.onload = (e) => {
					NProgress.start();
					const success = submitProjectReport(e.target.result);
					if (success) {
						noty({
							timeout: 4000,
							type: 'success',
							text: '<b>Upload Successful!</b><br>Project report has been submitted.',
						});
					} else {
						noty({
							timeout: 5000,
							text: '<b>Error!</b><br>There was an error uploading the project report.' +
								' Please check the file format.',
						});
					}
					NProgress.done();
				};
				reader.readAsBinaryString(file);
			}
		});
	};

	// parses project report and saves data
	function submitProjectReport(file) {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', `/upload-s3?file-name=${file.name}&file-type=${file.type}`);
		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					const response = JSON.parse(xhr.responseText);
					uploadFile(file, response.signedRequest, response.url);
				} else {
					noty({ type: 'error', text: 'Could not get signed URL.' });
				}
			}
		};
		xhr.send();
	}
})();
