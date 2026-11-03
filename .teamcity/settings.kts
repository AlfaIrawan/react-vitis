import jetbrains.buildServer.configs.kotlin.*
import jetbrains.buildServer.configs.kotlin.buildSteps.script
import jetbrains.buildServer.configs.kotlin.triggers.vcs

version = "2024.12"

project {
    buildType(VitisBuild)
    buildType(VitisDeploy)
}

object VitisBuild : BuildType({
    name = "Vitis - Build image"
    description = "Build a versioned Docker image and publish it as an artifact."
    artifactRules = "ci-out/*"
    params {
        param("env.VITIS_BUILD_ID", "%teamcity.build.id%")
        param("env.VITIS_RUN_TYPECHECK", "false")
    }
    vcs {
        root(DslContext.settingsRoot)
        branchFilter = "+:<default>"
    }
    steps {
        script {
            name = "Validate and build Docker image"
            scriptContent = "bash scripts/teamcity/build.sh"
        }
    }
    // The Deploy trigger queues the whole chain, avoiding duplicate build triggers.
    requirements {
        equals("teamcity.agent.jvm.os.name", "Linux")
        equals("vitis.build", "true")
    }
    failureConditions { executionTimeoutMin = 30 }
})

object VitisDeploy : BuildType({
    name = "Vitis - Deploy server"
    description = "Build and deploy the same-chain image on the selected Linux server agent."
    maxRunningBuilds = 1
    params {
        param("env.VITIS_BROKER_SOCKET", "/run/tectona-ci-deploy/control.sock")
    }
    vcs {
        root(DslContext.settingsRoot)
        branchFilter = "+:<default>"
    }
    dependencies {
        snapshot(VitisBuild) {
            onDependencyFailure = FailureAction.FAIL_TO_START
            onDependencyCancel = FailureAction.CANCEL
        }
        artifacts(VitisBuild) {
            buildRule = sameChain()
            artifactRules = "* => ci-in"
            cleanDestination = true
        }
    }
    steps {
        script {
            name = "Verify image and deploy through server broker"
            scriptContent = "bash scripts/teamcity/deploy-broker.sh"
        }
    }
    // Queue this configuration to run the entire build -> deploy chain automatically.
    triggers { vcs { branchFilter = "+:<default>" } }
    requirements {
        equals("teamcity.agent.jvm.os.name", "Linux")
        equals("vitis.deploy", "true")
        equals("vitis.target", "10.100.0.143")
    }
    failureConditions { executionTimeoutMin = 15 }
})
