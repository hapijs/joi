test:
	@node node_modules/lab/bin/lab -a code
test-cov:
	@node node_modules/lab/bin/lab -t 100 -a code
test-cov-html:
	@node node_modules/lab/bin/lab -r html -o coverage.html -a code

.PHONY: test test-cov test-cov-html
