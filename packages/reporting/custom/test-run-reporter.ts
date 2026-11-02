import  logger  from '@packages/core/config/logger';
import os from 'node:os';
import { formatLocalTime } from '@packages/core/lib/common-funcs';
import { 
    Reporter, 
    TestCase, 
    TestError, 
    TestResult, 
    TestStep, 
    Suite, 
    FullConfig, 
    FullResult } from "@playwright/test/reporter";
import { getReportProperties, getRunWorkerCount, type ReportProperties } from '@packages/core/config/report-properties';


/** Vendor-neutral snapshot passed to edition-specific completion hooks. */
export interface TestRunSummary {
    machine: string;
    runningOs: string;
    environment: string;
    browser: string;
    ram: string;
    workers: number;
    reportProperties?: ReportProperties[];
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    errors: number;
    passRate: number;
    startTime: string;
    endTime: string;
    duration: string;
    status: string;
}

export class TestRunReporter implements Reporter {
    private starttime: string = '';
    private endtime: string = '';
    private duration: number = 0;
    private passed: number = 0;
    private failed: number = 0;
    private skipped: number = 0;
    private errors: number = 0;
    private total: number = 0;
    private workers: number = 0;
    private outputDirs: string[] = [];
    private readonly reportProperties = new Map<string, ReportProperties>();
    private runResultStatus = '';

    /**
     * Called when the test execution begins.
     * Logs a message to indicate the start of test execution.
     * @param {FullConfig} config - The full configuration of the test run.
     * @param {Suite} suite - The top-level suite of all tests.
     */
    onBegin(config: FullConfig, suite: Suite): void {
        this.workers = getRunWorkerCount(config);
        this.outputDirs = config.projects.map(project => project.outputDir);
        logger.info({event: `Started`, message: `Test Execution Started`}); 
    }

    /**
     * Called before a suite of tests is executed.
     * Writes a log message with the title of the suite and the number of tests in the suite.
     * @param {Suite} suite - The suite that is about to be executed.
     */
    onSuiteBegin(suite: Suite): void {
        logger.info({event: `Started Suite`, message:`[Number of tests: ${suite.suites.length}]`}); 
    }

    /**
     * Called before a test is executed.
     * Writes a log message with the test title and '[Test Started]' tag.
     * @param {TestCase} test - The test that is about to be executed.
     */
    onTestBegin(test: TestCase): void {
        logger.info({event: `Started TestCase`, message: test.title});
    }

    /**
     * Called after a test has finished execution.
     * Writes a log message with the test title and its status.
     * @param {TestCase} test - The test that has finished execution.
     * @param {TestResult} result - The result of the test.
     */
    onTestEnd(test: TestCase, result: TestResult): void {
        this.total ++;
        const properties = this.getTestReportProperties(test, result);
        if (properties) {
            this.reportProperties.set(JSON.stringify(properties), properties);
        }
        if (result.status === 'passed') {
            this.passed ++;
        } else if ((result.status === 'failed') || (result.status === 'interrupted') || (result.status === 'timedOut')) {
            this.failed ++;
        } else if (result.status === 'skipped') {
            this.skipped ++;
            for (const annotation of result.annotations ?? test.annotations) {
                if (annotation.type === 'skip' && annotation.description) {
                    logger.info({event: 'Skip Reason', message: annotation.description});
                }
            }
        }
        
        logger.info({event: `Completed TestCase`, message: test.title + ` on worker ${result.workerIndex}`, status: result.status.toUpperCase()});
    }

    /**
     * Called when a test suite is about to exit.
     * Writes a log message with a suite completed message.
     * @param {Suite} suite - The test suite that has finished execution.
     */
    onSuiteEnd(suite: Suite): void {
        logger.info({event: `Completed Suite`, message:`[Number of tests: ${suite.suites.length}]`}); 
    }

    /**
     * Called before a test step is executed.
     * Writes a log message with the step title, if the step is of category 'test.step'.
     * @param {TestCase} test - The test that the step belongs to.
     * @param {TestResult} result - The test result.
     * @param {TestStep} step - The test step.
     */
    onStepBegin(test: TestCase, result: TestResult, step: TestStep): void {
        if (step.category === `test.step`) {
            logger.info({event: `Executing Step`, message: `${step.title} | Test: ${test.title} | Worker: ${result.workerIndex}`});
        }
    }

    /**
     * Called after a test step has finished execution.
     * Writes a log message with the step title and its status.
     * @param {TestCase} test - The test that the step belongs to.
     * @param {TestResult} result - The result of the step.
     * @param {TestStep} step - The step that has finished execution.
     */
    onStepEnd(test: TestCase, result: TestResult, step: TestStep): void {
        if (step.category === `test.step`) {
            logger.info({event: `Completed Step`, message: `${step.title} | Test: ${test.title} | Worker: ${result.workerIndex}`});
        }
    }

    /**
     * Called when an error occurs during the test run.
     * Writes a log message with the error message.
     * @param {TestError} error - The error that occurred
     */
    onError(error: TestError): void {
        this.errors ++;
        logger.error({event: `Error`, message: error.stack});
    }

    /**
     * Called when the test run is about to exit.
     * Writes a log message with the test result summary.
     * @param {FullResult} result - The test result
     * @return {Promise<{ status?: FullResult["status"]; } | undefined | void>} - A promise that resolves with the test result status or undefined if no status is provided, or void if the test result is undefined.
     */
    async onEnd(result: FullResult): Promise<void> {
        this.starttime = formatLocalTime(result.startTime);
        this.endtime = formatLocalTime(new Date());
        this.duration = Math.round(result.duration/1_000); //duration in seconds
        this.runResultStatus = result.status;
        logger.info({event: `Test Execution Completed`,  message:`Starttime: [${this.starttime}] | Endtime: [${this.endtime}] | Duration: [${this.duration}] seconds`});    
        logger.info({event: `Summary`, message: `Total cases: [${this.total}], PASSED: [${this.passed}], FAILED: [${this.failed}], SKIPPED: [${this.skipped}], ERRORS: [${this.errors}]`});

        
    }

    private formatBytes(bytes: number): string {
        return `${(bytes / (1024 ** 3)).toFixed(2)} GB`;
    }

    private formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        const pad = (value: number): string => String(value).padStart(2, '0');
        return `${pad(hours)} hours ${pad(minutes)} minutes ${pad(remainingSeconds)} seconds`;
    }

    private getTestReportProperties(test: TestCase, result: TestResult): ReportProperties | undefined {
        let suite: Suite | undefined = test.parent;
        while (suite) {
            const project = suite.project();
            if (project) {
                return getReportProperties({
                    project,
                    config: { workers: this.workers },
                    workerIndex: result.workerIndex,
                    parallelIndex: result.parallelIndex,
                    annotations: test.annotations,
                }, project.use, { RUN_ENV: 'Unknown' });
            }
            suite = suite.parent;
        }
        return undefined;
    }

    /**
     * Called when the test run is about to exit.
     * @return {Promise<void>} A promise that resolves when the exit is complete.
     */
    async onExit(): Promise<void> {
        logger.info({event: `Exit`, message: `=======================`});

        const reportProperties = [...this.reportProperties.values()].sort((a, b) =>
            a.Project.localeCompare(b.Project) || a.Browser.localeCompare(b.Browser) || a.WorkerIndex - b.WorkerIndex);
        const summary: TestRunSummary = {
            machine: `${os.hostname()} (${os.platform()} ${os.release()})`,
            runningOs: `${os.platform()} ${os.release()}`,
            environment: [...new Set(reportProperties.map(properties => properties.RunEnv))].join(', ') || 'Unknown',
            browser: [...new Set(reportProperties.map(properties => `${properties.Project}: ${properties.Browser}`))].join(', ') || 'Unknown',
            ram: `${this.formatBytes(os.totalmem())} total, ${this.formatBytes(os.totalmem() - os.freemem())} used, ${this.formatBytes(os.freemem())} free`,
            workers: this.workers,
            reportProperties,
            total: this.total,
            passed: this.passed,
            failed: this.failed,
            skipped: this.skipped,
            errors: this.errors,
            passRate: this.total === 0 ? 0 : (this.passed / this.total) * 100,
            startTime: this.starttime,
            endTime: this.endtime,
            duration: this.formatDuration(this.duration),
            status: this.runResultStatus,
        };

        await this.onRunComplete(summary, this.outputDirs);
    }

    /** Extension point; the shared reporter performs no external delivery. */
    protected async onRunComplete(_summary: TestRunSummary, _outputDirs: readonly string[]): Promise<void> {}
}

export default TestRunReporter;
