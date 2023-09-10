// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @title ControlWhitelist
 * @dev This contract manages whitelists for different projects and user inferences.
 */
contract ControlWhitelist {
    address public _owner;

    struct Project {
        address[] whiteList;
    }

    struct InferenceProject {
        uint32 inferenceTrials;
        mapping(address => uint32) userInferenceTrials;
    }

    mapping(string => InferenceProject) public inferenceProjects;

    mapping(string => Project) projects;

    /**
     * @dev Constructor to initialize the ControlWhitelist contract.
     */
    constructor() {
        _owner = msg.sender;
    }

    /**
     * @dev Modifier to restrict access to only the owner of the contract.
     */
    modifier onlyOwner() {
        require(msg.sender == _owner, "Only the owner can call this function");
        _;
    }

    /**
     * @dev Modifier to restrict access to the owner or owner contracts.
     */
    modifier onlyOwnerContract() {
        require(
            msg.sender == _owner || tx.origin == _owner,
            "Only the owner or owner contracts can call this function"
        );
        _;
    }

    /**
     * @dev Add a user to the whitelist of a project.
     * @param _projectName The name of the project to add the user to.
     * @param _user The address of the user to add to the whitelist.
     */
    function addWhitelistUser(
        string memory _projectName,
        address _user
    ) public onlyOwner {
        Project storage project = projects[_projectName];
        project.whiteList.push(_user);
    }

    /**
     * @dev Check if the sender's wallet address is whitelisted for a project.
     * @param _projectName The name of the project to check.
     * @return A boolean indicating whether the sender is in the whitelist.
     */
    function isInWhitelist(
        string memory _projectName
    ) public view returns (bool) {
        Project storage project = projects[_projectName];
        for (uint256 i = 0; i < project.whiteList.length; ++i) {
            if (project.whiteList[i] == msg.sender) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Check if an address is in the whitelist of a project.
     * @param _projectName The name of the project to check.
     * @param _address The address to check.
     * @return A boolean indicating whether the address is in the whitelist.
     */
    function isInWhiteListMaster(
        string memory _projectName,
        address _address
    ) public view onlyOwnerContract returns (bool) {
        Project storage project = projects[_projectName];
        for (uint i = 0; i < project.whiteList.length; i++) {
            if (project.whiteList[i] == _address) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Remove a user from the whitelist of a project.
     * @param _projectName The name of the project to remove the user from.
     * @param _address The address of the user to remove from the whitelist.
     */
    function removeFromWhitelist(
        string memory _projectName,
        address _address
    ) public onlyOwner {
        Project storage project = projects[_projectName];
        for (uint256 i = 0; i < project.whiteList.length; ++i) {
            if (project.whiteList[i] == _address) {
                // Asignar la billetera al ultimo elemento de la array
                project.whiteList[i] = project.whiteList[
                    project.whiteList.length - 1
                ];
                // Actualizar el índice del último elemento en el map projects
                projects[_projectName].whiteList[i] = project.whiteList[i];
                // elimina el ultimo valor de la array
                project.whiteList.pop();

                return;
            }
        }
        revert("Address not in whiteList");
    }

    /**
     * @dev Add a user to a project's inference whitelist with a specified number of trials.
     * @param _projectName The name of the project to add the user to.
     * @param _user The address of the user to add to the inference whitelist.
     * @param inferenceTimes The number of inference trials for the user.
     */
    function addInferenceWhitelist(
        string memory _projectName,
        address _user,
        uint32 inferenceTimes
    ) public onlyOwner {
        InferenceProject storage project = inferenceProjects[_projectName];
        project.userInferenceTrials[_user] = inferenceTimes;
    }

    /**
     * @dev Check if the sender is in the inference whitelist for a project and has available trials.
     * @param _projectName The name of the project to check.
     * @return A boolean indicating whether the sender is in the inference whitelist and has trials available.
     */
    function isInInferenceWhitelist(
        string memory _projectName
    ) public view returns (bool) {
        InferenceProject storage project = inferenceProjects[_projectName];
        return project.userInferenceTrials[msg.sender] > 0;
    }

    /**
     * @dev Get the number of remaining inference trials for the sender in a project.
     * @param _projectName The name of the project to check.
     * @return The number of remaining inference trials for the sender.
     */
    function inferenceNumberRemaining(
        string memory _projectName
    ) public view returns (uint32) {
        InferenceProject storage project = inferenceProjects[_projectName];
        return project.userInferenceTrials[msg.sender];
    }

    /**
     * @dev Reduce the number of available inference trials for the sender in a project.
     * @param _projectName The name of the project to reduce trials for.
     */
    function reduceInferenceTrials(string memory _projectName) public {
        InferenceProject storage project = inferenceProjects[_projectName];
        require(
            project.userInferenceTrials[msg.sender] > 0,
            "No hay intentos disponibles."
        );
        project.userInferenceTrials[msg.sender] -= 1;
    }
    
    /**
     * @dev Get the number of available inference trials for a user in a project.
     * @param _projectName The name of the project to check.
     * @param _user The address of the user to check trials for.
     * @return The number of available inference trials for the user.
     */
    function controlInferences(
        string memory _projectName,
        address _user
    ) public view onlyOwner returns (uint32) {
        InferenceProject storage project = inferenceProjects[_projectName];
        if (project.userInferenceTrials[_user] > 0) {
            return project.userInferenceTrials[_user];
        } else {
            return 0;
        }
    }
}
