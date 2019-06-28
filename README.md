# For Production Build

---

## Steps to build for Production

1. Build image
2. Run the image
3. Make sure .node_env is complete
4. Run seeders

**_Note:- If you have volume mounted see the "If you have volume mounted" section below_**

## 1. Build image

Start off by running docker-compose.yml using the command.

`docker-compose build node`

This will start building the docker image for the project. For a no cache build :-

`docker-compose build --no-cache node`

## 2. Run the image

After the image is build, we need to run the image by

`docker-compose up`

This will start the project along with MongoDB and Minio stacks.

## 3. Make sure .node_env is complete

Compare .node_env with .env.example. If any key-value pair is missing in .node_env, copy it in from the .env.example.

## 4. Run seeders

For testing, seeders are needed to be run.

docker ps will list all the running processes. Copy the container ID with the process marked "remotepatientmonitoring_node".

Now run these command in this particular order,

1. `docker exec -it <conatainerId> bash`
2. `npm run seeder`

# For Development build

---

## Steps to build for Development

1. Edit docker-compose.yml
2. Build image
3. Run the image
4. Make sure .node_env is complete
5. Run seeders

**_Note: -If you have volume mounted see the "If you have volume mounted" section below_**

## 1. Edit docker-compose.yml

In the docker-compose.yml, after line 7, add '- "3000:3000"'
On line 8 change the command as 'command: ["npm", "run", "dev"]'

After editing, the snippet will look like this.

    ports:
      - "5000:5000"
      - "3000:3000"
      command: ["npm", "run", "dev"]

## 2. Build image

Start off by running docker-compose.yml using the command.

`docker-compose build node`

This will start building the docker image for the project. For a no cache build :-

`docker-compose build --no-cache node`

## 3. Run the image

After the image is build, we need to run the image by

`docker-compose up`

This will start the project along with MongoDB and Minio stacks.

## 4. Make sure .node_env is complete

Compare .node_env with .env.example. If any key-value pair is missing in .node_env, copy it in from the .env.example.

## 5. Running seeders

Now for testing, seeders are needed to be run.

`docker ps` will list all the running processes. Copy the container ID with the process marked "remotepatientmonitoring_node".

Now,

1. `docker exec -it <conatainerId> bash`
2. `npm run seeder`

---

### If you have volume mounted

If you're running the project first time. Run the following command

1. `docker-compose run node npm install`
2. `docker-compose run node npm run postinstall`
3. `docker-compose run node npm run build`
