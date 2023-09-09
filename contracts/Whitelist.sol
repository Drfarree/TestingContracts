// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (token/ERC20/ERC20.sol)


pragma solidity ^0.8.0;


contract ControlWhitelist {
    address public _owner;

    struct Project{
        address[] whiteList;
    }

    struct InferenceProject {
        uint32 inferenceTrials; 
        mapping(address => uint32) userInferenceTrials; 
    }

    mapping(string => InferenceProject) public inferenceProjects;
    

    mapping (string => Project) projects;


    constructor () {
        _owner = msg.sender;
    }

    modifier onlyOwner {
        require (msg.sender == _owner, "Only the owner can call this function");
        _;
    }

    // @dev: User is added to whitelist
    function addWhitelistUser(string memory _projectName, address _user) onlyOwner public {
        Project storage project = projects[_projectName];
        project.whiteList.push(_user);
    }

    // @dev: Check if msg.sender wallet is whitelisted.
    function isInWhitelist(string memory _projectName) public view returns(bool) {
        Project storage project = projects[_projectName];
        for (uint256 i = 0; i < project.whiteList.length; ++i){
            if (project.whiteList[i] == msg.sender) {
                return true;
            }   
        }
        return false;
    }

    // @dev: This function is called by the Owner to check projects whitelist.
    function isInWhiteListMaster(string memory _projectName, address _address) onlyOwner public view returns (bool) {
      Project storage project = projects[_projectName];
      for (uint i = 0; i < project.whiteList.length; i++) {
        if (project.whiteList[i] == _address) {
          return true;
        }
      }
      return false;
    }

    // @dev: This function remove a user from a projectName
    function removeFromWhitelist(string memory _projectName, address _address) onlyOwner public {
        Project storage project = projects[_projectName];
        for (uint256 i = 0; i < project.whiteList.length; ++i){
            if (project.whiteList[i] == _address){
                // Asignar la billetera al ultimo elemento de la array
                project.whiteList[i] = project.whiteList[project.whiteList.length - 1];
                // Actualizar el índice del último elemento en el map projects
                projects[_projectName].whiteList[i] = project.whiteList[i];
                // elimina el ultimo valor de la array
                project.whiteList.pop();

                return;
            }
        }
        revert("Address not in whiteList");
    }


    // @dev: Agregar un usuario a un proyecto específico con un número de intentos específico
    function addInferenceWhitelist(string memory _projectName, address _user, uint32 inferenceTimes) public onlyOwner {
        InferenceProject storage project = inferenceProjects[_projectName];
        project.userInferenceTrials[_user] = inferenceTimes;
    }

    // @dev: Verificar si el usuario está en la lista de inferencias y tiene intentos disponibles para un proyecto específico
    function isInInferenceWhitelist(string memory _projectName) public view returns (bool) {
        InferenceProject storage project = inferenceProjects[_projectName];
        return project.userInferenceTrials[msg.sender] > 0;
    }

    // @dev: Obtener el número de intentos restantes para un usuario en un proyecto específico
    function inferenceNumberRemaining(string memory _projectName) public view returns (uint32) {
        InferenceProject storage project = inferenceProjects[_projectName];
        return project.userInferenceTrials[msg.sender];
    }

    // @dev: Reducir el número de intentos disponibles para un usuario en un proyecto específico
    function reduceInferenceTrials(string memory _projectName) public {
        InferenceProject storage project = inferenceProjects[_projectName];
        require(project.userInferenceTrials[msg.sender] > 0, "No hay intentos disponibles.");
        project.userInferenceTrials[msg.sender] -= 1;
    }

    function controlInferences(string memory _projectName, address _user) public view onlyOwner returns (uint32) {
        InferenceProject storage project = inferenceProjects[_projectName];
        if (project.userInferenceTrials[_user] > 0) {
            return project.userInferenceTrials[_user];
        } else {
            return 0;
        }
    }




}